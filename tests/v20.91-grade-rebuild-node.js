/**
 * v20.91-grade-rebuild-node.js — 九品制改档 + 道具扩展验收：
 *   Q1 九品谱：十档品级在册（九品→一品 + 特殊），倍率/序严格递增，旧串有折算
 *   Q2 数据迁移：全物品库无旧品质串漏网；重复的九天仙衣/龙魂杖已归一
 *   Q3 逻辑接线：背包筛选/排序/颜色、页面按钮、送礼档、琴品梯、商铺货架、拍卖行、存档读档全认新档
 *   Q4 品级补阶：六品/四品/二品新档有货；副手/项链/双戒/双饰品梯补密；一品毕业线（30+）全身成套
 *   Q5 特殊信物：36 枚独一份（16 男主 + 20 女主），结契发放幂等，不进商铺不进拍卖
 *
 * 运行：node tests/v20.91-grade-rebuild-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
function loadScript(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

var passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}

// ============ 世界桩 ============
var W = {
    console: { log: function () {}, warn: function () {}, error: function () {} },
    setTimeout: function (fn) { try { fn(); } catch (e) {} return 0; },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    document: {
        createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }, dataset: {}, innerHTML: '' }; },
        getElementById: function () { return null; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {},
        body: { appendChild: function () {} }
    },
    alert: function () {}
};
W.window = W;
W.EventBus = { emit: function () {}, on: function () {} };
W.gameLog = { entries: [], add: function (t, ty) { W.gameLog.entries.push({ t: String(t), ty: ty }); } };
W.inventory = { currency: { copper: 0, spiritStones: 0 }, slots: [] };
W.currentEquipment = {};
var addedItems = [];
W.addItem = function (id, n) {
    W.inventory.slots.push({ templateId: id, count: n || 1 });
    addedItems.push(id);
    return true;
};

vm.createContext(W);
function load(rel) { vm.runInContext(loadScript(rel), W, { filename: rel }); }

// 物品库全量装配（页面加载序同式）
load('js/items.js');
['01-pills', '02-weapons', '03-armor', '04-materials', '05-talismans', '06-arts', '07-food', '08-special'].forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/items-extended.js');
['13-missing-ids', '14-ability-manuals', '15-root-refine', '16-dangling-ids', '17-lead-tokens', '18-grade-expansion'].forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/extensions/talisman-advanced.js');

var NEW_KEYS = ['PIN9', 'PIN8', 'PIN7', 'PIN6', 'PIN5', 'PIN4', 'PIN3', 'PIN2', 'PIN1', 'UNIQUE'];
var OLD_KEYS = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];

// ==================== Q1 九品谱 ====================
console.log('\n[Q1] 九品谱：十档品级');
(function () {
    var Q = W.ITEM_QUALITIES;
    ok(!!Q, 'Q1 品质表该在物品系统导出');
    NEW_KEYS.forEach(function (k) { ok(!!Q[k] && !!Q[k].name, 'Q1 品级 ' + k + ' 在册'); });
    var names = NEW_KEYS.map(function (k) { return Q[k].name; });
    ok(names.join(',') === '九品,八品,七品,六品,五品,四品,三品,二品,一品,特殊', 'Q1 品名该是九品到一品加特殊（实得 ' + names.join(',') + '）');
    var muls = NEW_KEYS.map(function (k) { return Q[k].multiplier; });
    ok(muls.every(function (m, i) { return i === 0 || m > muls[i - 1]; }), 'Q1 倍率该严格递增');
    var orders = NEW_KEYS.map(function (k) { return Q[k].order; });
    ok(orders.join(',') === '1,2,3,4,5,6,7,8,9,10', 'Q1 档位序该从 1 排到 10');
    // 旧串折算
    ok(W.normalizeQuality('LEGENDARY') === 'PIN3' && W.normalizeQuality('MYTHIC') === 'PIN1' && W.normalizeQuality('COMMON') === 'PIN9', 'Q1 旧品质串该折算到新档');
    ok(W.normalizeQuality('PIN5') === 'PIN5' && W.normalizeQuality(undefined) === 'PIN9', 'Q1 新串原样过、空串落九品');
    ok(W.qualityOrder('UNIQUE') === 10 && W.qualityOrder('MYTHIC') === 9, 'Q1 档位序查询新旧串都认');
    // 旧键别名指向同一份定义
    ok(Q.COMMON === Q.PIN9 && Q.LEGENDARY === Q.PIN3 && Q.MYTHIC === Q.PIN1, 'Q1 旧键该是同一份定义的别名');
})();

// ==================== Q2 数据迁移 ====================
console.log('\n[Q2] 全库迁移');
(function () {
    var all = W.allItems || [];
    ok(all.length > 300, 'Q2 物品库该有三百件以上（实得 ' + all.length + '）');
    var strays = all.filter(function (it) { return it.quality && OLD_KEYS.indexOf(it.quality) >= 0; });
    ok(strays.length === 0, 'Q2 物品库不该有旧品质串漏网' + (strays.length ? '：' + strays.slice(0, 3).map(function (s) { return s.id + '=' + s.quality; }).join(',') : ''));
    var unknown = all.filter(function (it) { return it.quality && NEW_KEYS.indexOf(it.quality) < 0; });
    ok(unknown.length === 0, 'Q2 物品库不该有品级表以外的串' + (unknown.length ? '：' + unknown.slice(0, 3).map(function (s) { return s.id + '=' + s.quality; }).join(',') : ''));
    // 迁移后的分布：九八七五三一都该有货
    var byQ = {};
    all.forEach(function (it) { if (it.quality) byQ[it.quality] = (byQ[it.quality] || 0) + 1; });
    ['PIN9', 'PIN8', 'PIN7', 'PIN5', 'PIN3', 'PIN1'].forEach(function (k) {
        ok((byQ[k] || 0) > 0, 'Q2 旧档迁移后 ' + k + ' 该有货（实得 ' + (byQ[k] || 0) + '）');
    });
    // 重复归一：九天仙衣、龙魂杖各只该有一件
    var robes = all.filter(function (it) { return it.name === '九天仙衣'; });
    ok(robes.length === 1 && robes[0].id === 'arm_nine_heaven_robe', 'Q2 九天仙衣该归一（实得 ' + robes.length + ' 件）');
    var staffs = all.filter(function (it) { return it.name === '龙魂杖'; });
    ok(staffs.length === 1 && staffs[0].id === 'dragon_staff', 'Q2 龙魂杖该归一（实得 ' + staffs.length + ' 件）');
    ok(!W.itemById['wpn_dragon_soul_staff'] && !W.itemById['nine_heaven_robe'], 'Q2 被删的重复件不该还在物品库');
    // 新增件名字不许与库中既有件撞车（旧库自带的重名是历史账，另案处理）
    var nameCount = {};
    all.forEach(function (it) { if (it.name) nameCount[it.name] = (nameCount[it.name] || 0) + 1; });
    var fresh = (W.extendedGradeExpansion || []).concat(W.LEAD_TOKENS || []);
    var dup = fresh.filter(function (it) { return nameCount[it.name] !== 1; }).map(function (it) { return it.name; });
    ok(dup.length === 0, 'Q2 新增件不该与全库重名' + (dup.length ? '：' + dup.slice(0, 5).join(',') : ''));
    // 源码层：数据文件不该再出现旧品质串（兼容表除外）
    var dataFiles = ['js/items-extended/01-pills.js', 'js/items-extended/02-weapons.js', 'js/items-extended/03-armor.js',
        'js/items-extended/04-materials.js', 'js/items-extended/05-talismans.js', 'js/items-extended/06-arts.js',
        'js/items-extended/07-food.js', 'js/items-extended/08-special.js'];
    var srcStray = dataFiles.filter(function (f) { return /'(COMMON|UNCOMMON|RARE|EPIC|LEGENDARY|MYTHIC)'/.test(loadScript(f)); });
    ok(srcStray.length === 0, 'Q2 扩展数据文件源码不该有旧品质串' + (srcStray.length ? '：' + srcStray.join(',') : ''));
})();

// ==================== Q3 逻辑接线 ====================
console.log('\n[Q3] 逻辑接线');
(function () {
    var invSrc = loadScript('js/inventory.js');
    ok(/QUALITIES: \['all', 'PIN9', 'PIN8', 'PIN7', 'PIN6', 'PIN5', 'PIN4', 'PIN3', 'PIN2', 'PIN1', 'UNIQUE'\]/.test(invSrc), 'Q3 背包品质筛选该收全十档');
    ok(/QUALITY_RANK = \{ PIN9:1/.test(invSrc) && /UNIQUE:10/.test(invSrc), 'Q3 背包排序该认十档序');
    ok(/normalizeQuality\(t\.quality\)/.test(invSrc), 'Q3 品质筛选该折算旧串再比对');
    ok(/PIN1:'一品', UNIQUE:'特殊'/.test(invSrc), 'Q3 品质名表该有新档');
    var htmlSrc = loadScript('仙侠.html');
    var btns = (htmlSrc.match(/data-quality="PIN\d"/g) || []).length + (htmlSrc.match(/data-quality="UNIQUE"/g) || []).length;
    ok(btns === 10, 'Q3 页面品质按钮该有十个新档（实得 ' + btns + '）');
    ok(!/data-quality="(COMMON|LEGENDARY|MYTHIC)"/.test(htmlSrc), 'Q3 页面不该留旧档按钮');
    ok(htmlSrc.indexOf('js/items-extended/17-lead-tokens.js') > 0 && htmlSrc.indexOf('js/items-extended/18-grade-expansion.js') > 0, 'Q3 页面该加载信物与补阶两个新档');
    ok(htmlSrc.indexOf('16-dangling-ids.js') < htmlSrc.indexOf('17-lead-tokens.js'), 'Q3 新档该接在补洞档之后加载');
    var appSrc = loadScript('js/app.js');
    ok(/'PIN9': 0/.test(appSrc) && /'UNIQUE': 5/.test(appSrc), 'Q3 送礼品质档该认新串');
    var qinSrc = loadScript('js/qin-arts.js');
    ok(/PIN7: 3/.test(qinSrc) && /PIN1: 9/.test(qinSrc) && /UNIQUE: 10/.test(qinSrc), 'Q3 琴品梯该铺满十档');
    var shopSrc = loadScript('js/enhanced-shop.js');
    ok(/MANUAL_QUALITY_REALM = \{ PIN7: 0/.test(shopSrc), 'Q3 秘籍境界门该按新档设卡');
    ok(/_shopQRank\(it\.quality\) >= 7/.test(shopSrc), 'Q3 商铺上架闸该按档位序拦高档货');
    ok(!/'LEGENDARY'|'MYTHIC'/.test(shopSrc), 'Q3 商铺源码不该再认旧串');
    var aucSrc = loadScript('js/economy/auction-service.js');
    ok(/\['PIN3', 'PIN2', 'PIN1', 'UNIQUE'\]/.test(aucSrc), 'Q3 拍卖行该把三品以上与特殊挡在池外');
    var gsSrc = loadScript('js/core/game-state.js');
    ok(/normalizeQuality\(it\.quality\)/.test(gsSrc), 'Q3 读档该把旧装备克隆体的品质串折算到新档');
    var talSrc = loadScript('js/extensions/talisman-advanced.js');
    ok(/qualityOrder\(t\.quality\)/.test(talSrc), 'Q3 高级符堆叠上限该按档位序算');
})();

// ==================== Q4 品级补阶 ====================
console.log('\n[Q4] 品级补阶与毕业装');
(function () {
    var all = W.allItems || [];
    var byQ = {};
    all.forEach(function (it) { if (it.quality) byQ[it.quality] = (byQ[it.quality] || 0) + 1; });
    ['PIN6', 'PIN4', 'PIN2'].forEach(function (k) {
        ok((byQ[k] || 0) >= 5, 'Q4 新档 ' + k + ' 该有至少五件货（实得 ' + (byQ[k] || 0) + '）');
    });
    function slotItems(slot) { return all.filter(function (it) { return it.type === 'equipment' && it.slot === slot; }); }
    function ranks(slot) { return slotItems(slot).map(function (it) { return W.qualityOrder(it.quality); }); }
    // 副手盾梯：九品到一品该一路有货
    var oh = ranks('offHand');
    [1, 2, 3, 4, 6, 8, 9].forEach(function (r) { ok(oh.indexOf(r) >= 0, 'Q4 副手该有档位 ' + r + ' 的货'); });
    ok(slotItems('offHand').every(function (it) { return it.subtype === 'shield'; }) && slotItems('offHand').length >= 8, 'Q4 副手该至少八面盾（实得 ' + slotItems('offHand').length + '）');
    // 项链梯
    var nk = ranks('neck');
    [1, 2, 4, 7, 8, 9].forEach(function (r) { ok(nk.indexOf(r) >= 0, 'Q4 项链该有档位 ' + r); });
    // 双戒梯
    var r1 = ranks('ring1'), r2 = ranks('ring2');
    ok(r1.length >= 7 && r1.indexOf(9) >= 0 && r1.indexOf(8) >= 0 && r1.indexOf(2) >= 0, 'Q4 戒指一该成梯（' + r1.length + ' 枚，含高底两端）');
    ok(r2.length >= 5 && r2.indexOf(9) >= 0 && r2.indexOf(6) >= 0, 'Q4 戒指二该成梯（' + r2.length + ' 枚）');
    // 双饰品
    ok(ranks('acc1').length >= 5 && ranks('acc2').length >= 4, 'Q4 饰品一/二都该有货（' + ranks('acc1').length + '/' + ranks('acc2').length + '）');
    // 一品毕业线：30+ 级该覆盖全身主要槽位
    var pin1 = all.filter(function (it) { return it.quality === 'PIN1' && it.type === 'equipment'; });
    var pin1Slots = {};
    pin1.forEach(function (it) { pin1Slots[it.slot] = true; });
    ['mainHand', 'body', 'head', 'feet', 'waist', 'hands', 'offHand', 'neck', 'ring1', 'ring2', 'acc1', 'acc2'].forEach(function (s) {
        ok(!!pin1Slots[s], 'Q4 一品毕业装该盖到 ' + s + ' 槽');
    });
    ok(pin1.every(function (it) { return it.level >= 30; }), 'Q4 一品装备该全是 30 级往上');
    // 一品兵器：问天剑/涅槃杖在册且强度压过旧三品天花板
    var wt = W.itemById['wpn_heaven_ask'], np = W.itemById['wpn_nirvana_staff'];
    ok(!!wt && wt.quality === 'PIN1' && wt.level >= 34 && wt.combatBonus.attack >= 200, 'Q4 问天剑该是一品重兵');
    ok(!!np && np.quality === 'PIN1' && np.damageType === 'blunt', 'Q4 涅槃杖该是一品钝击法杖');
    ok(!W.itemById['nine_heaven_robe'] && !!W.itemById['arm_nine_turn_robe'], 'Q4 一品身甲由九转仙衣接棒');
    // 补阶货该全在物品库可查
    var exp = W.extendedGradeExpansion || [];
    ok(exp.length >= 40, 'Q4 补阶批次该至少四十件（实得 ' + exp.length + '）');
    ok(exp.every(function (it) { return W.itemById[it.id] === it; }), 'Q4 补阶每件都该注册进物品库');
    // 新丹药新灵材也补了档
    ok(!!W.itemById['pill_purple_vault'] && W.itemById['pill_purple_vault'].quality === 'PIN2', 'Q4 二品紫霄丹在册');
    ok(!!W.itemById['mat_chaos_marrow'] && W.itemById['mat_chaos_marrow'].quality === 'PIN2', 'Q4 二品混沌石髓在册');
})();

// ==================== Q5 特殊信物 ====================
console.log('\n[Q5] 特殊信物：独一份');
(function () {
    var tokens = W.LEAD_TOKENS || [];
    ok(tokens.length === 36, 'Q5 信物该 36 枚（实得 ' + tokens.length + '）');
    ok(tokens.every(function (t) { return t.quality === 'UNIQUE' && t.slot === 'acc2' && t.price === 0 && t.priceless === true; }),
        'Q5 信物皆特殊品级、佩在饰品二、无价不售');
    ok(tokens.every(function (t) { return W.itemById[t.id] === t; }), 'Q5 每枚信物都在物品库可查');
    var leads = tokens.map(function (t) { return t.tokenOf; });
    ok(new Set(leads).size === 36, 'Q5 一人一枚不重样');
    // 名册对账：20 位女主（heroine-rivalry.js）+ 16 位男主（各门派事件文件）全该有信物
    var hSrc = loadScript('js/npcs/heroine-rivalry.js');
    var heroines = (hSrc.match(/name: '([^']+)', sect:/g) || []).map(function (m) { return m.match(/name: '([^']+)'/)[1]; });
    ok(heroines.length === 20, 'Q5 女主名册该 20 位（实得 ' + heroines.length + '）');
    var heroMissing = heroines.filter(function (n) { return leads.indexOf(n) < 0; });
    ok(heroMissing.length === 0, 'Q5 女主该人手一枚信物' + (heroMissing.length ? '，缺：' + heroMissing.join(',') : ''));
    var maleSrc = '';
    ['zhujian', 'maoshan', 'daqi', 'dayin', 'gaibang', 'jingang', 'huashan', 'xiaoyao', 'songshan', 'pili', 'yaowang', 'xiayin', 'tianshu', 'tianya', 'wudang', 'yanluo'].forEach(function (f) {
        try { maleSrc += loadScript('js/npcs/' + f + '-events.js'); } catch (e) {}
    });
    var males = (maleSrc.match(/MALE_LEAD_ROSTER[\s\S]{0,200}?name: '([^']+)'/g) || []).map(function (m) { return m.match(/name: '([^']+)'/)[1]; });
    ok(males.length === 16, 'Q5 男主名册该 16 位（实得 ' + males.length + '）');
    var maleMissing = males.filter(function (n) { return leads.indexOf(n) < 0; });
    ok(maleMissing.length === 0, 'Q5 男主该人手一枚信物' + (maleMissing.length ? '，缺：' + maleMissing.join(',') : ''));
    // 结契发放：温蘅入册 → 香囊进背包；重结不重发；路人没有信物
    var map = W.LEAD_TOKEN_MAP || {};
    ok(map['温蘅'] === 'token_wen_heng', 'Q5 名册该按人名认领信物');
    W.inventory.slots.length = 0; addedItems.length = 0;
    ok(W.grantLeadToken('温蘅', {}) === true && addedItems[0] === 'token_wen_heng', 'Q5 结契该把信物放进背包');
    ok(W.grantLeadToken('温蘅', {}) === false && addedItems.length === 1, 'Q5 已有信物不重发（独一份）');
    ok(W.grantLeadToken('路人甲', {}) === false, 'Q5 名册外的人没有信物');
    // 戴在身上也算有：清掉背包、装到 acc2，再领该被拒
    W.inventory.slots.length = 0;
    W.currentEquipment = { acc2: { templateId: 'token_fei_lei' } };
    ok(W.grantLeadToken('绯泪', {}) === false, 'Q5 信物戴在身上也不重发');
    W.currentEquipment = {};
    // 发放接线：结契单一写点该调发放
    var dbSrc = loadScript('js/core/dao-bridge.js');
    ok(/grantLeadToken\(npc\.name/.test(dbSrc), 'Q5 结契写点该接信物发放');
    // 不进商铺不进拍卖：特殊档在商铺滤网与拍卖池外
    var shopSrc = loadScript('js/enhanced-shop.js');
    ok(/r >= 3 && r <= 8/.test(shopSrc), 'Q5 黑市稀罕滤网只收三到八档（特殊在外）');
    ok(/\['PIN3', 'PIN2', 'PIN1', 'UNIQUE'\]/.test(loadScript('js/economy/auction-service.js')), 'Q5 拍卖池该把特殊挡在外');
    // 掉落表不该有信物（独一份 = 只有那个人给）
    var lootSrc = loadScript('js/loot-system.js');
    ok(lootSrc.indexOf('token_') < 0, 'Q5 掉落表不该混进信物');
    // 文案纪律：信物描述全中文，不许漏英文串
    var leaky = tokens.filter(function (t) { return /[A-Za-z]{3}/.test(t.desc); });
    ok(leaky.length === 0, 'Q5 信物文案无漏翻' + (leaky.length ? '：' + leaky[0].id : ''));
})();

// ==================== 结果 ====================
console.log('\n========== v20.91 九品改制 ==========');
console.log('通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
