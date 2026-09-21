// ==================== 门派补厚批二验收：特色重做成身份（8派样板） ====================
// 覆盖：A 接线 / B 八派样板存在 / C 修罗宫血引（杀意累积+世界反应+沉淀） / D 药王谷识毒济生（药材真代价+枯年双份） /
//       E 丐帮街谈网（打点费+接街谈库） / F 铸剑淬火（耐久折损+炎城枯变异） / G 少林戒疤（层数+转淡） /
//       H 天山雪魄（雪莲或灵石+冰原枯变异） / I 天书阁万卷归一 / J 唐门袖箭淬毒 / K 文案纪律
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

let passed = 0; const failures = [];
function ok(cond, msg) { if (cond) { passed++; } else { failures.push(msg); console.log('  ✗ ' + msg); } }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ============ A 接线 ============
{
    ok(read('仙侠.html').indexOf('js/sects/sect-identity.js') >= 0, 'A1 身份层已挂脚本位（特色层之后）');
    ok(read('仙侠.html').indexOf('sect-specialties.js') < read('仙侠.html').indexOf('sect-identity.js'), 'A2 加载顺序：先特色后身份（覆盖生效）');
    ok(read('js/sects/sect-specialties.js').indexOf('specialty.precheck') >= 0, 'A3 引擎 precheck 钩子（代价不足打回，不烧冷却）');
    const v = read('js/sects/sect-visit.js');
    // 改造批：特色按钮卡整套退役，换成「门中底子」被动卡（sect-passives）
    // 十三波修订：八派身份技（有 precheck/costText 代价的活内容）有了带门的正门——
    // 卡只对带代价的内容亮；旧 28 派纯增益条目（无这些字段）照旧退役，按钮不复活
    ok(v.indexOf('sectPassiveCard') >= 0, 'A4 底子卡上岗（被动成长层）');
    ok(v.indexOf('useSectSpecialty') >= 0 && v.indexOf('precheck') >= 0 && v.indexOf('costText') >= 0, 'A4b 身份技有带门的正门（只亮有代价的活内容，旧增益按钮不复活）');
    ok(read('tests/run-all.sh').indexOf('sect-identity-node.js') >= 0, 'A5 本套件已入回归清单');
}

// ============ 运行时沙箱 ============
function makeWorld(opts) {
    opts = opts || {};
    var msgs = [], logs = [], day = opts.day || 300, minute = opts.minute || 0;
    var inv = { currency: { spiritStones: opts.stones != null ? opts.stones : 500 }, slots: opts.slots || [], maxSlots: 50 };
    var W = {
        console: { log: function () {}, warn: function () {} },
        Math: Math, JSON: JSON, Object: Object, Array: Array, String: String, Number: Number, isFinite: isFinite, alert: function (m) { msgs.push(String(m)); },
        eventFlags: opts.flags || {},
        discipleState: opts.ds || { isInSect: true, sectId: '修罗宫', rank: 5, contribution: 0 },
        inventory: inv,
        itemById: {
            'mat_liquorice': { id: 'mat_liquorice', name: '甘草', subtype: 'herb', stackable: true },
            'mat_snow_lotus': { id: 'mat_snow_lotus', name: '雪莲', subtype: 'herb', stackable: true },
            'special_poison': { id: 'special_poison', name: '毒药', subtype: 'poison', stackable: true }
        },
        currentEquipment: opts.equipment || { mainHand: null },
        currentCharData: { combatSkills: {} },
        showMessage: function (m) { msgs.push(String(m)); },
        gameLog: { add: function (m) { logs.push(String(m)); } },
        addItem: function (id, n) { (W._added = W._added || []).push({ id: id, n: n }); return true; },
        updateInventoryUI: function () {},
        sectAddContribution: function (n, reason) {
            var d = W.discipleState; if (!d) return 0;
            d.contribution = (Number(d.contribution) || 0) + n;
            (W._ledgerNotes = W._ledgerNotes || []).push({ n: n, reason: reason });
            return d.contribution;
        },
        activeBuffs: {},
        timeSystem: { getAbsoluteDay: function () { return day; } },
        GameScheduler: { nowMinute: function () { return minute; } },
        _msgs: msgs, _logs: logs,
        _setDay: function (d) { day = d; },
        _bumpDay: function (n) { day += n; (W._dayHooks || []).forEach(function (fn) { fn(); }); },
        _adv: function (hours) { minute += hours * 60; },
        _lastMsg: function () { return msgs[msgs.length - 1] || ''; },
        enterCity: function () {}
    };
    W.window = W;
    // 捕获日钩
    var origSub = null;
    W.timeSystem.onNewDaySubscribe = function (fn) { (W._dayHooks = W._dayHooks || []).push(fn); };
    var ctx = vm.createContext(W);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-specialties.js'), 'utf8'), ctx, { filename: 'sect-specialties' });
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sects/sect-identity.js'), 'utf8'), ctx, { filename: 'sect-identity' });
    return W;
}
function slot(id, n) { return { templateId: id, count: n, getTemplate: function () { return null; } }; }

// ============ B 八派样板存在 ============
{
    var W = makeWorld();
    var expect = {
        '修罗宫': '血引', '药王谷': '识毒济生', '丐帮': '街谈网', '铸剑山庄': '心火淬火',
        '少林寺': '戒疤面壁', '天山派': '雪魄养心', '天书阁': '万卷归一', '唐门': '袖箭淬毒'
    };
    var allOk = true, missing = [];
    Object.keys(expect).forEach(function (sect) {
        var sp = W.SECT_SPECIALTIES[sect];
        if (!sp || sp.name !== expect[sect] || !sp.costText) { allOk = false; missing.push(sect); }
    });
    ok(allOk, 'B1 八派样板全部覆盖旧按钮buff，且都带代价说明' + (missing.length ? '（缺：' + missing.join(',') + '）' : ''));
    ok(W.SECT_SPECIALTIES['武当派'].name === '太极演武', 'B2 未铺开的派原样保留（样板先行，不殃及池鱼）');
    ok(W.SECT_SPECIALTIES['修罗宫'].desc.indexOf('血') >= 0 && W.SECT_SPECIALTIES['丐帮'].desc.indexOf('墙根') >= 0, 'B3 特色描述从命门/地形里长出来（不再是干巴的功能说明）');
}

// ============ C 修罗宫·血引 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '修罗宫', rank: 5 } });
    W.useSectSpecialty('修罗宫');
    ok(W.eventFlags['sect_id_shura_killing'] === 25 && W.activeBuffs['sect_xiuluo_buff'], 'C1 血引：杀意攒一层，攻升防降真上buff');
    ok(W.activeBuffs['sect_xiuluo_buff'].effects.attack === 0.3 && W.activeBuffs['sect_xiuluo_buff'].effects.defense === -0.16, 'C2 杀意「微动」层：攻+30%防-16%（幅度随杀意，不再一刀切+50%）');
    ok(W._lastMsg().indexOf('血') >= 0 && W.SECT_SPECIALTIES['修罗宫'].stateText().indexOf('已动') >= 0, 'C3 状态只报档位词（微动/已动/如藏锋/出鞘），永不报裸数字');
    W._adv(21); W.eventFlags['sect_id_shura_killing'] = 55;
    W.useSectSpecialty('修罗宫');
    ok(W.eventFlags['sect_id_shura_killing'] === 80 && W._logs.join('').indexOf('演武场') >= 0, 'C4 杀意过半：同门侧目（世界反应，一次性）');
    var n0 = W._logs.length;
    W._adv(21); W.useSectSpecialty('修罗宫');
    ok(W.eventFlags['sect_id_shura_killing'] === 100 && W._logs.join('').indexOf('留意') >= 0 && W.eventFlags['sect_id_shura_marked'] === 1, 'C5 杀意出鞘：正道留意名单（一次性旗，进城被盯的钥匙）');
    W._bumpDay(1);
    ok(W.eventFlags['sect_id_shura_killing'] === 95, 'C6 杀意每日沉淀（不是只涨不落的印钞机）');
    W.eventFlags['qi_stage'] = 2;
    W._bumpDay(1);
    ok(W.eventFlags['sect_id_shura_killing'] === 93, 'C7 枯年杀意更难压（沉淀减半，接主线总闸）');
}

// ============ D 药王谷·识毒济生 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '药王谷', rank: 5 }, stones: 100 });
    W.useSectSpecialty('药王谷');
    ok(W._lastMsg().indexOf('药篓是空的') >= 0 && !W.activeBuffs['sect_yaowang_buff'], 'D1 没药材就打回（识毒先得有毒可识）');
    ok(W.getSectSpecialtyCooldown('药王谷').ready === true, 'D2 代价不足不烧冷却（precheck 在冷却前）');
    W.inventory.slots.push(slot('mat_liquorice', 3));
    W.useSectSpecialty('药王谷');
    ok(W.inventory.slots[0].count === 2 && W.activeBuffs['sect_yaowang_buff'], 'D3 药材真被吃掉一份，buff 真上身');
    ok(W.activeBuffs['sect_yaowang_buff'].effects.constitution === 20 && W.activeBuffs['sect_yaowang_buff'].effects.willpower === 20, 'D4 百毒不侵之效走六维真键（不是安慰剂别名）');
    // 枯年双份
    var W2 = makeWorld({ ds: { isInSect: true, sectId: '药王谷', rank: 5 }, flags: { qi_stage: 2 } });
    W2.inventory.slots.push(slot('mat_liquorice', 1));
    W2.useSectSpecialty('药王谷');
    ok(W2._lastMsg().indexOf('两份') >= 0 && !W2.activeBuffs['sect_yaowang_buff'], 'D5 枯年药力减等：一份不够，打回说清楚');
    W2.inventory.slots.push(slot('mat_liquorice', 1));
    W2.useSectSpecialty('药王谷');
    ok(!W2.inventory.slots[0] && !W2.inventory.slots[1] && W2.activeBuffs['sect_yaowang_buff'], 'D6 枯年吃两份，办从前一份的事');
}

// ============ E 丐帮·街谈网 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '丐帮', rank: 5 }, stones: 15 });
    W.useSectSpecialty('丐帮');
    ok(W._lastMsg().indexOf('二十灵石') >= 0 && W.inventory.currency.spiritStones === 15, 'E1 打点费不够：打回且分文不动');
    var W2 = makeWorld({ ds: { isInSect: true, sectId: '丐帮', rank: 5 }, stones: 100 });
    W2.useSectSpecialty('丐帮');
    ok(W2.inventory.currency.spiritStones === 80, 'E2 消息不白听：二十灵石真扣');
    var talk = W2._logs.filter(function (l) { return l.indexOf('街谈网') >= 0; });
    ok(talk.length === 2, 'E3 每次落两条街谈（不是一句空话）');
    // 接主线街谈库
    var W3 = makeWorld({ ds: { isInSect: true, sectId: '丐帮', rank: 5 }, flags: { qi_route: 'oppose', qi_street: [{ day: 1, text: '枯水巷的老井打了三丈深，还是没见着水。' }] } });
    W3.useSectSpecialty('丐帮');
    ok(W3._logs.join('').indexOf('枯水巷的老井') >= 0, 'E4 主线账翻开后，丐帮的耳朵听得见街谈库（孤岛打通）');
    var W4 = makeWorld({ ds: { isInSect: true, sectId: '丐帮', rank: 5 }, flags: { qi_stage: 2 } });
    W4.useSectSpecialty('丐帮');
    ok(W4._logs.join('').match(/流民|灵石铺子|兽群|香火|船票|讨饭/) !== null, 'E5 枯年街谈换池子（说的全是世道变薄的事）');
}

// ============ F 铸剑山庄·心火淬火 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '铸剑山庄', rank: 3 }, stones: 100 });
    W.useSectSpecialty('铸剑山庄');
    ok(W._lastMsg().indexOf('连兵刃都没有') >= 0, 'F1 空手打回：淬什么火');
    W.currentEquipment.mainHand = { name: '青锋剑', durability: 5 };
    W.useSectSpecialty('铸剑山庄');
    ok(W._lastMsg().indexOf('卷口') >= 0 && !W.activeBuffs['sect_zhujian_buff'], 'F2 刃快碎了不许淬（先养护或换刀）');
    W.currentEquipment.mainHand = { name: '青锋剑', durability: 50 };
    W.useSectSpecialty('铸剑山庄');
    ok(W.inventory.currency.spiritStones === 70 && W.currentEquipment.mainHand.durability === 40, 'F3 炭钱三十真扣、耐久真折十（利一分，铁薄一分）');
    ok(W.activeBuffs['sect_zhujian_buff'].effects.attack === 0.25, 'F4 淬火新锋：攻+25%');
    var W2 = makeWorld({ ds: { isInSect: true, sectId: '铸剑山庄', rank: 3 }, flags: { qi_withered_炎城: 300 }, equipment: { mainHand: { name: '青锋剑', durability: 50 } } });
    W2.useSectSpecialty('铸剑山庄');
    ok(W2.activeBuffs['sect_zhujian_buff'].effects.attack === 0.12 && W2._lastMsg().indexOf('炉温') >= 0, 'F5 炎城火脉枯了：淬火效力减半（特色变异接主线城账）');
}

// ============ G 少林·戒疤面壁 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '少林寺', rank: 5 }, stones: 100 });
    W.useSectSpecialty('少林寺');
    ok(W.inventory.currency.spiritStones === 90 && W.eventFlags['sect_id_shaolin_jieba'] === 1, 'G1 香火钱十灵石、戒疤落一层');
    ok(W.activeBuffs['sect_shaolin_buff'].effects.defense === 0.2, 'G2 一层戒疤：防+20%');
    W._adv(25); W.useSectSpecialty('少林寺');
    W._adv(25); W.useSectSpecialty('少林寺');
    ok(W.eventFlags['sect_id_shaolin_jieba'] === 3 && W.activeBuffs['sect_shaolin_buff'].effects.defense === 0.3, 'G3 戒疤三层封顶：防+30%（攒得出来，也攒得出上限）');
    W._adv(25); W.useSectSpecialty('少林寺');
    ok(W.eventFlags['sect_id_shaolin_jieba'] === 3, 'G4 三层已满不再涨');
    ok(W._logs.join('').indexOf('皮肉') >= 0, 'G5 戒疤满层：扫地老僧认得这个分量（世界反应一次性）');
    W._setDay(W.timeSystem.getAbsoluteDay() + 7); W._bumpDay(0);
    ok(W.eventFlags['sect_id_shaolin_jieba'] === 2, 'G6 七日不面壁，戒疤淡一层（功夫不进则退）');
}

// ============ H 天山派·雪魄养心 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '天山派', rank: 5 }, stones: 10 });
    W.useSectSpecialty('天山派');
    ok(W._lastMsg().indexOf('空手') >= 0 && !W.activeBuffs['sect_tianshan_buff'], 'H1 既无雪莲又无香火钱：雪魄不认空手');
    W.inventory.currency.spiritStones = 100;
    W.useSectSpecialty('天山派');
    ok(W.inventory.currency.spiritStones === 80 && W.activeBuffs['sect_tianshan_buff'].effects.qiRegen === 0.5, 'H2 灵石路线：香火钱二十、气机自回');
    var W2 = makeWorld({ ds: { isInSect: true, sectId: '天山派', rank: 5 }, stones: 0, slots: [slot('mat_snow_lotus', 1)] });
    W2.inventory.slots[0].getTemplate = function () { return W2.itemById['mat_snow_lotus']; };
    W2.useSectSpecialty('天山派');
    ok(W2.inventory.slots[0] === null || W2.inventory.slots[0].count === 0, 'H3 雪莲做引：药材真被吃掉');
    var W3 = makeWorld({ ds: { isInSect: true, sectId: '天山派', rank: 5 }, flags: { qi_withered_冰原城: 200 } });
    W3.useSectSpecialty('天山派');
    ok(W3.activeBuffs['sect_tianshan_buff'].effects.qiRegen === 0.25 && W3._lastMsg().indexOf('冰死了魂') >= 0, 'H4 冰原城枯：雪魄只得半分（特色变异接主线城账）');
}

// ============ I 天书阁·万卷归一 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '天书阁', rank: 3 }, stones: 40 });
    W.useSectSpecialty('天书阁');
    ok(W._lastMsg().indexOf('纸贵') >= 0 && W.inventory.currency.spiritStones === 40, 'I1 抄书钱不够：打回不动钱');
    var W2 = makeWorld({ ds: { isInSect: true, sectId: '天书阁', rank: 3 }, stones: 200 });
    W2.useSectSpecialty('天书阁');
    ok(W2.inventory.currency.spiritStones === 150 && W2.activeBuffs['sect_tianshu_buff'].effects.wisdom === 0.4 && W2.activeBuffs['sect_tianshu_buff'].effects.cultivationSpeed === 0.2, 'I2 抄书钱五十：悟性+修炼速度双buff（cultivationSpeed 有真读者）');
    var W3 = makeWorld({ ds: { isInSect: true, sectId: '天书阁', rank: 3 }, flags: { qi_stage: 2 } });
    W3.useSectSpecialty('天书阁');
    ok(W3.activeBuffs['sect_tianshu_buff'].effects.cultivationSpeed === 0.1 && W3._lastMsg().indexOf('天地变了') >= 0, 'I3 枯年读书：字缝里的灵气淡了，修炼增益减半');
}

// ============ J 唐门·袖箭淬毒 ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '唐门', rank: 5 } });
    W.useSectSpecialty('唐门');
    ok(W._lastMsg().indexOf('不出空手') >= 0 && !W.activeBuffs['sect_tang_buff'], 'J1 没毒就打回（毒是唐门家底）');
    W.inventory.slots.push(slot('special_poison', 2));
    W.inventory.slots[0].getTemplate = function () { return W.itemById['special_poison']; };
    W.useSectSpecialty('唐门');
    ok(W.inventory.slots[0].count === 1 && W.activeBuffs['sect_tang_buff'].effects.poisonDmg === 0.3, 'J2 毒药真被吃掉一份：毒伤+30%会心+10%');
    var W2 = makeWorld({ ds: { isInSect: true, sectId: '唐门', rank: 5 }, flags: { qi_stage: 2 }, slots: [slot('special_poison', 1)] });
    W2.inventory.slots[0].getTemplate = function () { return W2.itemById['special_poison']; };
    W2.useSectSpecialty('唐门');
    ok(W2.activeBuffs['sect_tang_buff'].effects.poisonDmg === 0.15 && W2._lastMsg().indexOf('淬了两遍') >= 0, 'J3 枯年毒虫不长：毒伤减半（变异有叙事）');
}

// ============ L 模板铺开（其余二十八派） ============
{
    var W = makeWorld({ ds: { isInSect: true, sectId: '武当派', rank: 5 }, stones: 100 });
    var wd = W.SECT_SPECIALTIES['武当派'];
    ok(wd.name === '太极演武' && wd.desc.indexOf('松涛') >= 0 && wd.costText.indexOf('启功费') >= 0, 'L1 模板派：名字不动、描述换成身份叙事、代价上卡');
    var W0 = makeWorld({ ds: { isInSect: true, sectId: '武当派', rank: 5 }, stones: 5 });
    W0.useSectSpecialty('武当派');
    ok(W0._lastMsg().indexOf('还没凑齐') >= 0 && W0.inventory.currency.spiritStones === 5 && W0.getSectSpecialtyCooldown('武当派').ready === true, 'L2 启功费不够：打回、分文不动、不烧冷却');
    W.useSectSpecialty('武当派');
    ok(W.inventory.currency.spiritStones === 80 && W.activeBuffs['sect_wudang_buff'].effects.parry === 0.15, 'L3 常态：二十灵石真扣、buff 原样上身');
    var W2 = makeWorld({ ds: { isInSect: true, sectId: '武当派', rank: 5 }, flags: { qi_stage: 2 } });
    W2.useSectSpecialty('武当派');
    ok(W2.activeBuffs['sect_wudang_buff'].effects.parry === 0.075 && W2._lastMsg().indexOf('枯年') >= 0, 'L4 枯年：buff 真减半、话里说清打了折');
    var wd2 = W2.SECT_SPECIALTIES['武当派'];
    ok(wd2.effect.indexOf('7.5%') >= 0 && wd2.effect.indexOf('枯年打折') >= 0, 'L5 枯年展示文本同步减半（UI是真理，不挂羊头卖狗肉）');
    W2.eventFlags['qi_stage'] = 0;
    ok(wd2.effect.indexOf('招架率+15%') >= 0, 'L6 常态恢复：展示文本回到全额');
    var W3 = makeWorld({ ds: { isInSect: true, sectId: '华山派', rank: 5 }, flags: { qi_stage: 2 } });
    var hs = W3.SECT_SPECIALTIES['华山派'];
    ok(hs.effect.indexOf('剑法技能+15') >= 0, 'L7 非百分比增益（技能点）不受枯年折算殃及，展示如旧');
    var W4 = makeWorld();
    var n = Object.keys(W4.SECT_SPECIALTIES).filter(function (s) { return W4.SECT_SPECIALTIES[s].costText; }).length;
    ok(n === 36, 'L8 三十六派全部有代价说明（八派定制+二十八派模板，无一漏网）');
    var tl = W4.SECT_SPECIALTIES['天龙教'];
    ok(tl.costText.indexOf('40灵石') >= 0, 'L9 教门香火贵：天龙教启功费四十（代价分档不是一口价）');
}

// ============ K 文案纪律 ============
{
    var src = read('js/sects/sect-identity.js');
    // 提取全部玩家可见字符串（单引号串），排除代码注释行与控制台日志（开发者可见，非玩家文本）
    var lines = src.split('\n').filter(function (l) {
        var t = l.trim();
        return t.indexOf('//') !== 0 && t.indexOf('console.log') < 0 && t.indexOf('console.warn') < 0;
    });
    var strs = [];
    lines.forEach(function (l) {
        var re = /'([^'\n]*[一-龥][^'\n]*)'/g, m;
        while ((m = re.exec(l))) strs.push(m[1]);
    });
    var text = strs.join('|');
    ok(!/[A-Za-z]/.test(text.replace(/sect_id_[a-z_]+|mat_[a-z_]+|special_poison|qi_[a-z_]+/g, '')), 'K1 玩家可见文本零外文字母');
    ok(text.indexOf('次数') < 0 && text.indexOf('上限') < 0 && text.indexOf('配额') < 0, 'K2 零配额句式');
    ok(text.indexOf('妹妹') < 0 && text.indexOf('姐姐') < 0, 'K3 年龄铁设定不破');
    // 运行期玩家可见文本（消息+日志）也扫一遍
    var W = makeWorld({ ds: { isInSect: true, sectId: '丐帮', rank: 5 } });
    W.useSectSpecialty('丐帮');
    var runtime = (W._msgs.join('|') + W._logs.join('|')).replace(/<[^>]+>/g, '');
    ok(!/[A-Za-z]/.test(runtime), 'K4 运行期消息零外文字母');
}

console.log('sect-identity: ' + passed + ' passed, ' + failures.length + ' failed');
if (failures.length) { failures.forEach(f => console.log('  FAIL: ' + f)); process.exit(1); }
