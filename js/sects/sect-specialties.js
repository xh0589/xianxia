// ==================== sect-specialties.js - 门派特色功能（P1） ====================
// 每个门派拥有独特的专属功能
// 依赖：sects.js（sectsData）、sects-system.js（discipleState）

// ============ 门派特色功能配置 ============
// type: 功能类型（buff/items/skill/quest/recipe）
// cooldown: 冷却时间（小时）
// rankReq: 最低职位要求（0=掌门最高，7=杂役最低）
// desc: 功能描述
// effect: 效果描述文本
const SECT_SPECIALTIES = {
    // ===== 正道门派 =====
    '少林寺': {
        name: '达摩洞悟道',
        icon: '🧘',
        desc: '在达摩洞中参悟佛法，可临时提升意志与防御',
        type: 'buff',
        effect: '防御+20%，意志+30，持续12小时',
        cooldown: 24,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_shaolin_buff', { defense: 0.2, mind: 30 }, 12);
            return '参悟佛法，心若明镜，防御提升！';
        }
    },
    '武当派': {
        name: '太极演武',
        icon: '☯️',
        desc: '领悟太极拳剑真意，提升化解与反击能力',
        type: 'buff',
        effect: '招架率+15%，反击率+15%，持续8小时',
        cooldown: 16,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_wudang_buff', { parry: 0.15, counter: 0.15 }, 8);
            return '以柔克刚，四两拨千斤！';
        }
    },
    '全真教': {
        name: '内丹修炼',
        icon: '⚗️',
        desc: '全真内丹心法，加速真气恢复与修炼效率',
        type: 'buff',
        effect: '真气恢复+50%，修炼速度+30%，持续6小时',
        cooldown: 12,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_quanzhen_buff', { qiRegen: 0.5, cultivationSpeed: 0.3 }, 6);
            return '金丹大道，真气充盈！';
        }
    },
    '华山派': {
        name: '剑气修炼',
        icon: '⚔️',
        desc: '华山剑法精要，提升剑法技能',
        type: 'skill',
        effect: '剑法技能+15，持续永久',
        cooldown: 48,
        rankReq: 5,
        applyEffect: function() {
            if (currentCharData?.combatSkills?.剑法 !== undefined) {
                currentCharData.combatSkills.剑法 = Math.min(100, currentCharData.combatSkills.剑法 + 15);
                return '剑法精进，威力大增！';
            }
            return '暂未领悟剑法';
        }
    },
    '嵩山派': {
        name: '嵩山剑阵',
        icon: '🗡️',
        desc: '演练嵩山剑阵，提升群体战斗能力',
        type: 'buff',
        effect: '群体攻击+25%，持续6小时',
        cooldown: 18,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_songshan_buff', { groupAtk: 0.25 }, 6);
            return '剑阵已成，势不可挡！';
        }
    },
    '恒山派': {
        name: '绵密剑法',
        icon: '🛡️',
        desc: '恒山剑法以守为攻，大幅提升防御',
        type: 'buff',
        effect: '防御+30%，持续8小时',
        cooldown: 16,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_hengshan_buff', { defense: 0.3 }, 8);
            return '绵里藏针，守中带攻！';
        }
    },
    '衡山派': {
        name: '云雾剑法',
        icon: '🌫️',
        desc: '衡山剑法变幻莫测，提升闪避与暴击',
        type: 'buff',
        effect: '闪避+20%，暴击+15%，持续6小时',
        cooldown: 18,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_hengshan2_buff', { dodge: 0.2, crit: 0.15 }, 6);
            return '剑出如雾，防不胜防！';
        }
    },
    '泰山派': {
        name: '泰山压顶',
        icon: '⛰️',
        desc: '泰山剑法厚重霸道，提升攻击力',
        type: 'buff',
        effect: '攻击+25%，持续8小时',
        cooldown: 16,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_taishan_buff', { attack: 0.25 }, 8);
            return '重剑无锋，大巧不工！';
        }
    },
    '峨眉派': {
        name: '峨眉剑意',
        icon: '🌸',
        desc: '峨眉剑法精妙绝伦，提升灵巧与内力',
        type: 'buff',
        effect: '灵巧+20%，内力恢复+30%，持续8小时',
        cooldown: 16,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_emei_buff', { agility: 0.2, qiRegen: 0.3 }, 8);
            return '峨眉剑意，灵动飘逸！';
        }
    },
    '丐帮': {
        name: '丐帮消息网',
        icon: '📡',
        desc: '利用丐帮遍布天下的弟子获取情报',
        type: 'quest',
        effect: '获得一个隐藏任务或宝藏线索',
        cooldown: 24,
        rankReq: 5,
        applyEffect: function() {
            return getGossipInfo();
        }
    },
    '大旗门': {
        name: '军阵操练',
        icon: '🏴',
        desc: '操练军阵杀伐之术，提升长兵与团队作战',
        type: 'buff',
        effect: '长兵技能+15，团队攻击+15%，持续8小时',
        cooldown: 20,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_daqi_buff', { teamAtk: 0.15 }, 8);
            if (currentCharData?.combatSkills?.长兵 !== undefined) {
                currentCharData.combatSkills.长兵 = Math.min(100, currentCharData.combatSkills.长兵 + 10);
            }
            return '军阵森严，战无不胜！';
        }
    },
    '侠隐阁': {
        name: '侠义传承',
        icon: '📜',
        desc: '学习侠隐阁的侠义之道，提升综合能力',
        type: 'skill',
        effect: '全技能+5，持续永久',
        cooldown: 72,
        rankReq: 3,
        applyEffect: function() {
            var skills = currentCharData?.combatSkills || {};
            var count = 0;
            for (var k in skills) {
                if (typeof skills[k] === 'number') {
                    skills[k] = Math.min(100, skills[k] + 3);
                    count++;
                }
            }
            return '侠义之道，融会贯通！' + count + '项技能提升';
        }
    },
    '药王谷': {
        name: '丹方研究',
        icon: '💊',
        desc: '研究独门丹方，可获得特殊丹药配方',
        type: 'recipe',
        effect: '获得随机丹药配方或成品丹药',
        cooldown: 24,
        rankReq: 5,
        applyEffect: function() {
            var pills = ['pill_small_recovery', 'pill_qi_gather', 'pill_energy_return', 'pill_body_foundation'];
            var reward = pills[Math.floor(Math.random() * pills.length)];
            if (typeof addItem === 'function') addItem(reward, 1);
            return '研究丹方成功，获得一枚丹药！';
        }
    },
    '天山派': {
        name: '寒冰修炼',
        icon: '❄️',
        desc: '在极寒之地修炼，提升水属性功法',
        type: 'buff',
        effect: '水属性功法伤害+30%，持续10小时',
        cooldown: 18,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_tianshan_buff', { waterDmg: 0.3 }, 10);
            return '寒冰入体，功力大增！';
        }
    },
    '铸剑山庄': {
        name: '名剑铸造',
        icon: '🔨',
        desc: '铸造专属武器，比普通武器高一个品级',
        type: 'items',
        effect: '获得一把门派专属武器',
        cooldown: 72,
        rankReq: 3,
        applyEffect: function() {
            var weapons = ['wpn_dark_iron_sword', 'wpn_frost_moon', 'wpn_spirit_sword'];
            var reward = weapons[Math.floor(Math.random() * weapons.length)];
            if (typeof addItem === 'function') addItem(reward, 1);
            return '铸剑成功！获得一把绝世好剑！';
        }
    },
    '茅山派': {
        name: '符箓绘制',
        icon: '📜',
        desc: '绘制独门符箓，可驱鬼除妖',
        type: 'items',
        effect: '获得随机符箓',
        cooldown: 12,
        rankReq: 5,
        applyEffect: function() {
            var talismans = ['tal_fireball', 'tal_icicle', 'tal_lightning', 'tal_shield'];
            var reward = talismans[Math.floor(Math.random() * talismans.length)];
            if (typeof addItem === 'function') addItem(reward, 1);
            return '符箓绘制成功！道法自然！';
        }
    },
    '大隐阁': {
        name: '隐士指点',
        icon: '👴',
        desc: '请隐世高人指点迷津，快速提升修为',
        type: 'buff',
        effect: '修炼速度+50%，持续4小时',
        cooldown: 48,
        rankReq: 3,
        applyEffect: function() {
            applyBuff('sect_dayin_buff', { cultivationSpeed: 0.5 }, 4);
            return '听君一席话，胜读十年书！';
        }
    },
    '天书阁': {
        name: '天书阅览',
        icon: '📖',
        desc: '阅览天书阁珍藏的失传典籍，提升悟性',
        type: 'buff',
        effect: '悟性+40%，持续6小时',
        cooldown: 36,
        rankReq: 3,
        applyEffect: function() {
            applyBuff('sect_tianshu_buff', { wisdom: 0.4 }, 6);
            return '天书奇文，豁然开朗！';
        }
    },
    '天涯海阁': {
        name: '诗词歌赋',
        icon: '🎵',
        desc: '以文入道，通过诗词歌赋提升精神修为',
        type: 'buff',
        effect: '意志+50，精神力恢复+30%，持续8小时',
        cooldown: 12,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_tianya_buff', { mind: 50, spiritRegen: 0.3 }, 8);
            return '腹有诗书气自华！';
        }
    },
    '神机门': {
        name: '机关研究',
        icon: '⚙️',
        desc: '研究机关术，可制作机关道具',
        type: 'items',
        effect: '获得随机机关道具',
        cooldown: 16,
        rankReq: 5,
        applyEffect: function() {
            if (typeof addItem === 'function') addItem('special_mechanism', 1);
            return '机关术精进，制作了一个精巧机关！';
        }
    },
    '霹雳堂': {
        name: '火药调配',
        icon: '💥',
        desc: '调配独门火药，制作强力爆炸物',
        type: 'items',
        effect: '获得霹雳堂独门火器',
        cooldown: 20,
        rankReq: 5,
        applyEffect: function() {
            if (typeof addItem === 'function') addItem('special_explosive', 1);
            return '火药调配成功，威力惊人！';
        }
    },
    '昆仑派': {
        name: '昆仑秘境',
        icon: '🏔️',
        desc: '进入昆仑秘境修炼，获得大量修为',
        type: 'buff',
        effect: '修炼效率+60%，持续8小时',
        cooldown: 48,
        rankReq: 3,
        applyEffect: function() {
            applyBuff('sect_kunlun_buff', { cultivationSpeed: 0.6 }, 8);
            return '昆仑秘境，灵气充沛！';
        }
    },
    '金刚宗': {
        name: '金刚不坏',
        icon: '🛡️',
        desc: '修炼金刚不坏神功，大幅提升肉身强度',
        type: 'buff',
        effect: '防御+40%，生命上限+30%，持续6小时',
        cooldown: 24,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_jingang_buff', { defense: 0.4, hpMax: 0.3 }, 6);
            return '金刚不坏，万法不侵！';
        }
    },
    '青城派': {
        name: '青城剑诀',
        icon: '🌿',
        desc: '青城剑法灵巧多变，提升剑法与身法',
        type: 'buff',
        effect: '剑法+20%，闪避+15%，持续8小时',
        cooldown: 16,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_qingcheng_buff', { swordSkill: 0.2, dodge: 0.15 }, 8);
            return '青城剑诀，灵动如风！';
        }
    },
    '蓬莱派': {
        name: '海外寻宝',
        icon: '🏝️',
        desc: '凭借蓬莱派的海图，寻找海外珍宝',
        type: 'quest',
        effect: '获得海外珍宝或稀有材料',
        cooldown: 48,
        rankReq: 5,
        applyEffect: function() {
            var treasures = ['mat_phoenix_feather', 'mat_dragon_blood', 'mat_dragon_scale', 'mat_pearl'];
            var reward = treasures[Math.floor(Math.random() * treasures.length)];
            if (typeof addItem === 'function') addItem(reward, 1);
            return '海外寻宝归来，获得珍稀材料！';
        }
    },
    // ===== 中立门派 =====
    '五仙教': {
        name: '蛊术研究',
        icon: '🐍',
        desc: '研究南疆蛊术，驭使毒虫',
        type: 'buff',
        effect: '毒系伤害+35%，持续12小时',
        cooldown: 20,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_wuxian_buff', { poisonDmg: 0.35 }, 12);
            return '蛊术已成，毒冠天下！';
        }
    },
    '逍遥派': {
        name: '逍遥游',
        icon: '🦅',
        desc: '逍遥派独门身法，大幅提升移动与闪避',
        type: 'buff',
        effect: '移动速度+50%，闪避+30%，持续4小时',
        cooldown: 24,
        rankReq: 3,
        applyEffect: function() {
            applyBuff('sect_xiaoyao_buff', { speed: 0.5, dodge: 0.3 }, 4);
            return '乘天地之正，御六气之辩！';
        }
    },
    '唐门': {
        name: '暗器工坊',
        icon: '🎯',
        desc: '制作唐门独门暗器，威力惊人',
        type: 'items',
        effect: '获得唐门专属暗器',
        cooldown: 24,
        rankReq: 5,
        applyEffect: function() {
            if (typeof addItem === 'function') addItem('special_hidden_weapon', 1);
            return '暗器制作完成，例无虚发！';
        }
    },
    '百花谷': {
        name: '百花酿制',
        icon: '🌸',
        desc: '采集百花酿制灵酒，可恢复气血与真气',
        type: 'items',
        effect: '获得百花灵酒',
        cooldown: 12,
        rankReq: 5,
        applyEffect: function() {
            if (typeof addItem === 'function') addItem('food_flower_wine', 1);
            return '百花酿成，芳香四溢！';
        }
    },
    '铁掌帮': {
        name: '铁掌功',
        icon: '🤚',
        desc: '修炼铁掌帮独门掌法，提升掌法威力',
        type: 'skill',
        effect: '拳掌技能+20，持续永久',
        cooldown: 48,
        rankReq: 5,
        applyEffect: function() {
            if (currentCharData?.combatSkills?.拳掌 !== undefined) {
                currentCharData.combatSkills.拳掌 = Math.min(100, currentCharData.combatSkills.拳掌 + 20);
                return '铁掌功大成，一掌开碑裂石！';
            }
            return '暂未领悟拳掌';
        }
    },
    // ===== 邪派门派 =====
    '修罗宫': {
        name: '修罗杀意',
        icon: '💀',
        desc: '激发修罗杀意，大幅提升攻击但降低防御',
        type: 'buff',
        effect: '攻击+50%，防御-20%，持续6小时',
        cooldown: 20,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_xiuluo_buff', { attack: 0.5, defense: -0.2 }, 6);
            return '杀意滔天，神挡杀神！';
        }
    },
    '阎罗殿': {
        name: '阎罗审判',
        icon: '⚖️',
        desc: '阎罗殿独门绝学，对生命值低于30%的敌人造成额外伤害',
        type: 'buff',
        effect: '斩杀线+15%（对30%血以下敌人伤害+40%），持续8小时',
        cooldown: 24,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_yanluo_buff', { executeDmg: 0.4, executeThreshold: 0.15 }, 8);
            return '阎罗要你三更死，谁敢留人到五更！';
        }
    },
    '血手门': {
        name: '血手毒功',
        icon: '🩸',
        desc: '修炼血手毒功，攻击附带毒素效果',
        type: 'buff',
        effect: '攻击附带毒伤，每秒造成5%攻击力的毒素伤害，持续10回合',
        cooldown: 16,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_xieshou_buff', { poisonAtk: 0.05 }, 10);
            return '血手毒功，沾之即死！';
        }
    },
    '飞蝎坞': {
        name: '毒药炼制',
        icon: '🧪',
        desc: '炼制飞蝎坞独门毒药',
        type: 'items',
        effect: '获得强力毒药',
        cooldown: 12,
        rankReq: 5,
        applyEffect: function() {
            if (typeof addItem === 'function') addItem('special_poison', 2);
            return '毒药炼制成功，无色无味！';
        }
    },
    '烈日教': {
        name: '烈日焚天',
        icon: '☀️',
        desc: '烈日教独门火系功法，提升火焰伤害',
        type: 'buff',
        effect: '火系伤害+45%，持续8小时',
        cooldown: 20,
        rankReq: 5,
        applyEffect: function() {
            applyBuff('sect_lieri_buff', { fireDmg: 0.45 }, 8);
            return '烈日当空，焚尽八荒！';
        }
    },
    '天龙教': {
        name: '天龙八部',
        icon: '🐉',
        desc: '天龙教镇教绝学，全面提升战斗力',
        type: 'buff',
        effect: '全属性+20%，持续6小时',
        cooldown: 36,
        rankReq: 3,
        applyEffect: function() {
            applyBuff('sect_tianlong_buff', { allStats: 0.2 }, 6);
            return '天龙降世，天下无敌！';
        }
    }
};

var sectSpecialtyState = { lastUseGameMinute: {} };

function _sectSpecialtyNowMinute() {
    if (window.GameScheduler && typeof window.GameScheduler.nowMinute === 'function') return window.GameScheduler.nowMinute();
    return (window.timeSystem && window.timeSystem.gameTime) ? (Number(window.timeSystem.gameTime.totalMinutes) || 0) : 0;
}

// ============ 应用Buff（辅助函数） ============
// W-4（接线五处 · 第四处）：`window.updateBuffUI` 此前全仓无定义，这一行一直是安全空操作——
//   门派特色增益存进了 window.activeBuffs（含效果与到期时辰），玩家看不见。
//   下面把 updateBuffUI 实现出来（见本文件末「增益面板」一节），这一行就自动接上了，别删它。
function applyBuff(buffId, effects, duration) {
    // 存储到全局buff系统
    if (!window.activeBuffs) window.activeBuffs = {};
    window.activeBuffs[buffId] = {
        effects: effects,
        expiryGameMinute: _sectSpecialtyNowMinute() + duration * 60,
        duration: duration
    };
    // 挂上谁给的这枚（useSectSpecialty 事先把门派特色的名号放在 _pendingBuffLabel 里；
    // 非门派通道进来的增益走 _buffLabelOf 的兜底，不硬造名字）
    if (_pendingBuffLabel) {
        _sectBuffLabels[buffId] = _pendingBuffLabel;
        _pendingBuffLabel = null;
    }
    if (typeof window.updateBuffUI === 'function') window.updateBuffUI();
}

// ============ 获取门派的特色功能 ============
function getSectSpecialty(sectName) {
    return SECT_SPECIALTIES[sectName] || null;
}

// ============ 使用门派特色功能 ============
function useSectSpecialty(sectName) {
    var specialty = SECT_SPECIALTIES[sectName];
    if (!specialty) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('此门派暂无特色功能', 'info');
        }
        return;
    }
    
    var ds = (typeof window.discipleState !== 'undefined') ? window.discipleState : { isInSect: false, rank: 7 };
    if (!ds.isInSect || ds.sectId !== sectName) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('只有本派弟子才能使用门派特色功能', 'warning');
        }
        return;
    }
    
    // 检查职位要求（rank越小地位越高，所以rank <= specialty.rankReq）
    if (ds.rank > specialty.rankReq) {
        var rankNames = ['掌门', '副掌门', '长老', '亲传弟子', '内门弟子', '外门弟子', '记名弟子', '杂役弟子'];
        var reqName = rankNames[specialty.rankReq] || ('等级' + specialty.rankReq);
        if (typeof window.showMessage === 'function') {
            window.showMessage('需要 ' + reqName + ' 才能使用此功能', 'error');
        }
        return;
    }
    
    // 身份层（批二）：precheck 先于冷却检查——代价不足直接打回，不烧冷却
    if (typeof specialty.precheck === 'function') {
        var blocked = null;
        try { blocked = specialty.precheck(); } catch (e) { blocked = null; }
        if (blocked) {
            if (typeof window.showMessage === 'function') {
                window.showMessage('✋ ' + specialty.name + '：' + blocked, 'warning');
            } else { alert('✋ ' + specialty.name + '：' + blocked); }
            return;
        }
    }

    // 冷却统一使用游戏时间，且随当前存档持久化。
    var lastUse = Number(sectSpecialtyState.lastUseGameMinute[sectName]);
    var cooldownMinutes = specialty.cooldown * 60;
    var now = _sectSpecialtyNowMinute();
    if (Number.isFinite(lastUse) && now - lastUse < cooldownMinutes) {
        var remaining = Math.ceil((cooldownMinutes - (now - lastUse)) / 60);
        if (typeof window.showMessage === 'function') {
            window.showMessage('这道神通刚施展过，气力还没缓回来——约 ' + remaining + ' 小时后再来', 'warning');
        }
        return;
    }
    
    // W-4：先把门派特色的名号递给 applyBuff，好让增益条上念得出「烈日焚天」而不是一串 id。
    //   43 个 applyBuff 调用点一个都没改——只有门派特色这一条路会挂上真名号，其余走兜底。
    _pendingBuffLabel = { icon: specialty.icon || '🏯', name: specialty.name || sectName, desc: specialty.effect || '' };
    var result = specialty.applyEffect();
    _pendingBuffLabel = null;
    sectSpecialtyState.lastUseGameMinute[sectName] = now;    
    if (typeof window.showMessage === 'function') {
        window.showMessage('✨ ' + specialty.name + '：' + result, 'success');
    } else {
        alert('✨ ' + specialty.name + '：' + result);
    }
    
    // 刷新UI
    if (typeof window.updateSectUI === 'function') window.updateSectUI();
}

// ============ 获取门派特色冷却时间 ============
function getSectSpecialtyCooldown(sectName) {
    var specialty = SECT_SPECIALTIES[sectName];
    if (!specialty) return null;
    
    var lastUse = Number(sectSpecialtyState.lastUseGameMinute[sectName]);
    if (!Number.isFinite(lastUse)) return { ready: true, remaining: 0 };
    var cooldownMinutes = specialty.cooldown * 60;
    var remaining = cooldownMinutes - (_sectSpecialtyNowMinute() - lastUse);
    if (remaining <= 0) return { ready: true, remaining: 0 };
    return { ready: false, remaining: Math.ceil(remaining / 60) };
}

// ============ 获取八卦信息（丐帮特色） ============
function getGossipInfo() {
    var gossips = [
        '听说南疆出现了一只千年妖兽，身上携带珍稀宝物。',
        '有消息称，某处秘境即将开启，传闻其中有失传的功法。',
        '据可靠情报，最近有一批魔教弟子潜入中州，图谋不轨。',
        '江湖传闻，天机老人的宝藏线索浮出水面...',
        '听说武当派和少林寺正在联手调查一件大事。',
        '有人在黑市上看到了传说中的神器碎片。',
        '据说铸剑山庄最近在铸造一柄绝世神兵。',
        '有消息说，某个隐世家族即将重出江湖。'
    ];
    var msg = gossips[Math.floor(Math.random() * gossips.length)];
    if (typeof window.showMessage === 'function') {
        window.showMessage('📡 丐帮消息：' + msg, 'info');
    }
    return msg;
}

function _cleanupExpiredSectBuffs() {
    var buffs = window.activeBuffs || {};
    var now = _sectSpecialtyNowMinute();
    Object.keys(buffs).forEach(function(id) {
        var buff = buffs[id];
        if (buff && buff.expiryGameMinute != null && now >= Number(buff.expiryGameMinute)) delete buffs[id];
    });
}

if (window.EventBus && typeof window.EventBus.on === 'function') {
    window.EventBus.on('time:advanced', _cleanupExpiredSectBuffs);
}
if (window.StateRegistry && typeof window.StateRegistry.register === 'function') {
    window.StateRegistry.register('sectSpecialties', {
        version: 1,
        export: function() {
            var sectBuffs = {};
            Object.keys(window.activeBuffs || {}).forEach(function(id) {
                if (id.indexOf('sect_') === 0) sectBuffs[id] = JSON.parse(JSON.stringify(window.activeBuffs[id]));
            });
            return { lastUseGameMinute: Object.assign({}, sectSpecialtyState.lastUseGameMinute), buffs: sectBuffs };
        },
        import: function(data) {
            data = data || {};
            sectSpecialtyState.lastUseGameMinute = Object.assign({}, data.lastUseGameMinute || {});
            window.activeBuffs = window.activeBuffs || {};
            Object.keys(window.activeBuffs).forEach(function(id) { if (id.indexOf('sect_') === 0) delete window.activeBuffs[id]; });
            Object.assign(window.activeBuffs, data.buffs || {});
            _cleanupExpiredSectBuffs();
            try { updateBuffUI(); } catch (e) { console.warn('[增益面板] 读档后刷新失败:', e); }
        },
        reset: function() {
            sectSpecialtyState.lastUseGameMinute = {};
            Object.keys(window.activeBuffs || {}).forEach(function(id) { if (id.indexOf('sect_') === 0) delete window.activeBuffs[id]; });
        }
    });
}

// ============ Buff 真翻译（v20.8）============
// 此前约 20 派特色 buff 用的是 defense/parry/crit/qiRegen… 这类属性合并处不认识的键——
// 写进 activeBuffs 后没有任何读者，等于安慰剂。这里把别名键翻译成六维真加成：
// |v| < 1 视为按比例（v20 特色都是 +20%/+50% 这类），≥1 视为直接加值（设施 tempBuff 的 mind:30 风格）。
var _SECT_BUFF_ATTR_MAP = {
    attack: ['strength'], groupAtk: ['strength'], teamAtk: ['strength'], swordSkill: ['strength'], executeDmg: ['strength'],
    fireDmg: ['strength'], waterDmg: ['strength'], poisonDmg: ['strength'], poisonAtk: ['strength'],
    dodge: ['dexterity'], crit: ['dexterity'], parry: ['dexterity'], counter: ['dexterity'], speed: ['dexterity'], agility: ['dexterity'],
    wisdom: ['intelligence'],
    mind: ['willpower'],
    defense: ['constitution'], hpMax: ['constitution'],
    qiRegen: ['meridian'], spiritRegen: ['meridian'],
    allStats: ['strength', 'dexterity', 'intelligence', 'willpower', 'constitution', 'meridian']
};
// executeThreshold 无对应战斗语义、cultivationSpeed 走 getSectBuffCultivationMul，均不进六维。
function sectBuffAttrBonus(effects, playerAttrs) {
    var out = {};
    if (!effects) return out;
    var SIX = ['strength', 'dexterity', 'intelligence', 'willpower', 'constitution', 'meridian'];
    for (var key in effects) {
        var v = effects[key];
        if (typeof v !== 'number') continue;
        var targets;
        if (SIX.indexOf(key) >= 0) targets = [key];           // 设施已是六维键：原样直加（保持旧行为）
        else targets = _SECT_BUFF_ATTR_MAP[key] || [];
        for (var ti = 0; ti < targets.length; ti++) {
            var t = targets[ti];
            var add = Math.abs(v) < 1 ? Math.round((playerAttrs ? (playerAttrs[t] || 10) : 10) * v) : Math.round(v);
            out[t] = (out[t] || 0) + add;
        }
    }
    return out;
}
// cultivationSpeed 真读者：修炼结算处按 activeBuffs 里的 cultivationSpeed 总和放大收益
function getSectBuffCultivationMul() {
    var total = 0;
    var buffs = window.activeBuffs || {};
    var nowMin = _sectSpecialtyNowMinute();
    for (var id in buffs) {
        var b = buffs[id];
        if (!b || !b.effects || ((b.expiryGameMinute || 0) <= nowMin)) continue;
        if (typeof b.effects.cultivationSpeed === 'number') total += b.effects.cultivationSpeed;
    }
    return 1 + total;
}

// ============ 增益面板（W-4：window.updateBuffUI 的实体） ============
// 落点：#panel-character → #sub-status 里那格 `grid grid-cols-2 md:grid-cols-4 gap-4 mb-6`
//   （仙侠.html:297，精力/真气/心情、境界、所在地/时间、日程四块并排的那一格网格）。
//   格子样式照那一带现成的写法抄（bg-gray-700/30 p-3 rounded-lg border border-gray-600），
//   不新造面板体系；整块铺满一行（见下面 updateBuffUI 里为什么用内联 grid-column）。
//   ⚠️ 仙侠.html 属禁改清单 ⇒ 容器由本函数运行时建，不动 HTML。
//   ⚠️ 内层不写死像素高度、不做内滚窗：一行 flex-wrap 排完，宽度不够自己换行。
// 一枚都不在的时候整块 hidden，不给玩家留一块空板。
var _sectBuffLabels = {};     // buffId → {icon, name, desc}（只有门派特色这条路会填）
var _pendingBuffLabel = null; // useSectSpecialty 递给 applyBuff 的一次性名号
var _BUFF_EFFECT_LABEL = {
    strength: '体魄', dexterity: '身法', intelligence: '悟性', willpower: '心志',
    constitution: '根骨', meridian: '经脉',
    executeThreshold: '斩杀线', cultivationSpeed: '修炼速度'
};
// 不走门派特色通道的那几条，名字是定的，直接写死（省得玩家看着一串 id 猜）
var _BUFF_FIXED_LABELS = {
    eatery_special: { icon: '🍲', name: '一席温饭' },
    demonic_flame: { icon: '🔥', name: '魔焰' },
    sect_holy_land_buff: { icon: '⛩️', name: '圣地参悟' },
    sect_canteen_meal: { icon: '🍚', name: '门派饭食' },
    sect_temper_edge: { icon: '🔥', name: '淬火' }
};

function _buffLabelOf(id) {
    if (_sectBuffLabels[id]) return _sectBuffLabels[id];
    if (_BUFF_FIXED_LABELS[id]) return _BUFF_FIXED_LABELS[id];
    // 兜底：只按前缀说个大概，**不硬造名字**；真 id 放进 title，出问题查得动
    if (id.indexOf('sect_') === 0) return { icon: '🏯', name: '门派增益' };
    if (id.indexOf('fxb_') === 0) return { icon: '🎪', name: '门派活动增益' };
    return { icon: '✨', name: '增益' };
}

// 效果键 → 人话：六维直用，别名键借 _SECT_BUFF_ATTR_MAP 反查一个念得出的六维名
function _buffEffectSummary(effects) {
    if (!effects) return '效果未注明';
    var out = [];
    for (var k in effects) {
        var v = effects[k];
        if (typeof v !== 'number') continue;
        var lab = _BUFF_EFFECT_LABEL[k];
        if (!lab) {
            var tgt = _SECT_BUFF_ATTR_MAP[k] || [];
            lab = tgt.length === 1 ? (_BUFF_EFFECT_LABEL[tgt[0]] || k) : k;
        }
        out.push(lab + (Math.abs(v) < 1 ? ' +' + Math.round(v * 100) + '%' : (v > 0 ? ' +' : ' ') + v));
    }
    return out.length ? out.join('、') : '效果未注明';
}

// 增益条挂在哪一格网格里
// ⚠️ headless 兜底：一批 node 套件（tests/sect-identity-node.js 等）在**没有 document** 的沙箱里
//   真调 applyBuff → updateBuffUI。DOM 不在就老实不画，别把异常抛回玩法那一侧。
function _buffUIHost() {
    if (typeof document === 'undefined' || !document || !document.getElementById) return null;
    var panel = document.getElementById('sub-status');
    if (!panel) return null;
    var kids = panel.children || [];
    for (var i = 0; i < kids.length; i++) {
        var cls = kids[i].className;
        if (typeof cls === 'string' && cls.indexOf('grid') >= 0 && cls.indexOf('col-span-4') < 0) return kids[i];
    }
    return null;
}

function updateBuffUI() {
    var host = _buffUIHost();
    if (!host) return;
    var box = document.getElementById('active-buff-strip');
    if (!box) {
        box = document.createElement('div');
        box.id = 'active-buff-strip';
        box.className = 'bg-gray-700/30 p-3 rounded-lg border border-gray-600';
        // 铺满整行用**内联** grid-column，不靠 Tailwind 的 md:col-span-*：
        // 实机（真 Chrome，1400px 视口，#sub-status 那格网格实测 1309px / 12 条轨道）量过——
        //   md:col-span-4     → grid-column: span 3 → 只有 315px（比现成的 md:col-span-2 那批还窄）
        //   md:col-span-full  → grid-column: span 3 → 同样 315px（这条工具类在本构建里也没生效）
        //   内联 1 / -1       → 1309px，真铺满
        // 那批格子自身的 md:col-span-2 也被解析成 span 4（426px），是既有现象，没动它们。
        box.style.gridColumn = '1 / -1';
        host.appendChild(box);
    }
    var buffs = window.activeBuffs || {};
    var now = _sectSpecialtyNowMinute();
    var ids = Object.keys(buffs).filter(function (id) {
        var b = buffs[id];
        if (!b) return false;
        if (b.expiryGameMinute != null && now >= Number(b.expiryGameMinute)) return false;
        return true;
    });
    if (!ids.length) {
        if (box.classList) box.classList.add('hidden');
        box.innerHTML = '';
        return;
    }
    if (box.classList) box.classList.remove('hidden');
    var chips = ids.map(function (id) {
        var b = buffs[id];
        var meta = _buffLabelOf(id);
        var left = Math.max(0, Math.ceil(((Number(b.expiryGameMinute) || 0) - now) / 60));
        var 急 = left <= 1;
        var soon = left > 1 && left <= 3;
        var 边 = 急 ? 'border-red-500/60' : (soon ? 'border-yellow-500/50' : 'border-emerald-500/40');
        var 字 = 急 ? 'text-red-300' : (soon ? 'text-yellow-300' : 'text-emerald-300');
        return '<span class="text-xs bg-gray-800/60 border ' + 边 + ' rounded px-2 py-1 ' + 字 + '"'
            + ' title="' + meta.icon + ' ' + meta.name + '｜' + id + '｜' + (meta.desc || _buffEffectSummary(b.effects)) + '">'
            + meta.icon + ' ' + meta.name + '：' + _buffEffectSummary(b.effects) + '（余 ' + left + ' 时）</span>';
    });
    box.innerHTML = '<p class="text-xs text-gray-400 mb-2">⏳ 此刻身上的增益（' + ids.length + '）</p>'
        + '<div class="flex flex-wrap gap-2">' + chips.join('') + '</div>';
}

// 时间一走就得跟着走：倒计时与到期都靠这条（到期的清扫 _cleanupExpiredSectBuffs 已挂在同一个事件上）
if (window.EventBus && typeof window.EventBus.on === 'function') {
    window.EventBus.on('time:advanced', function () { try { updateBuffUI(); } catch (e) { console.warn('[增益面板] 刷新失败:', e); } });
}

// ============ 导出 ============
window.SECT_SPECIALTIES = SECT_SPECIALTIES;
window.getSectSpecialty = getSectSpecialty;
window.useSectSpecialty = useSectSpecialty;
window.getSectSpecialtyCooldown = getSectSpecialtyCooldown;
window.applyBuff = applyBuff;
window.sectBuffAttrBonus = sectBuffAttrBonus;
window.getSectBuffCultivationMul = getSectBuffCultivationMul;
// W-4：门派特色增益面板的真身。此前全仓无定义 ⇒ applyBuff 末尾那行一直是安全空操作。
window.updateBuffUI = updateBuffUI;