/**
 * wave113-buyback-cap-node.js — 第一百一十三波（第六十八次自修）· DES-11 买卖套利结案：
 *   A 结构账：回购封顶这一道真在结算里（不是只写在注释里）
 *   B 普查账：全部「真柜台 × 货架真货」组合（货架每日随机，货表装齐扩展包，条数在 1700~1730 间浮动），同柜原地转卖净 ≤ 0（改前每代约 270 条为正，现算脚本 .scratch/v24-DE-prefix.cjs）
 *   C 病例账：三条同柜病例（筑基丹／大还丹／御剑）改前确为印钞口、改后逐条压回 ≤ 本柜买价（两个价都由报价单现算，不抄笔记）
 *   D 不误伤：基线号（口才 0、声望 0）一件货都不该被封顶；柜上没收的货仍按乘数走、且不高于行价
 *   E 设计保留：跨城「脚程换差价」照旧成立（wave42 C8 同口径），但任何柜台的回购都不高于本柜当日售价
 *   F 屏上账：被封顶时报价明细念出「柜上封顶」那一行（因子连乘不等于单价，就得写明白）
 *
 * 运行：node tests/wave113-buyback-cap-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; }
    else { failed++; console.error('[FAIL] ' + msg); }
}
function load(rel) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ==================== 共享全局桩（照 tests/wave42-wildmarket-node.js）====================
global.window = global;
var els = {};
var madeEls = [];   // createElement 出来的浮层（报价明细窗是这一类，不在 getElementById 的常驻节点里）
function fakeEl() {
    var el = { children: [], style: {}, className: '', id: '', classList: { toggle: function () {}, add: function () {}, remove: function () {}, contains: function () { return false; } }, appendChild: function (c) { this.children.push(c); return c; }, remove: function () {}, addEventListener: function () {}, querySelectorAll: function () { return []; }, closest: function () { return null; }, _html: '', textContent: '' };
    Object.defineProperty(el, 'innerHTML', { get: function () { return this._html; }, set: function (v) { this._html = String(v); }, configurable: true });
    return el;
}
global.document = {
    readyState: 'complete', createElement: function () { var e = fakeEl(); madeEls.push(e); return e; },
    getElementById: function (id) { if (!els[id]) els[id] = fakeEl(); return els[id]; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    addEventListener: function () {}, body: { appendChild: function () {} }
};
global.localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
global.showMessage = function () {};
global.gameLog = { entries: [], add: function () {} };
global.alert = function () {};
global.prompt = function () { return null; };
global.getAbsoluteDay = function () { return 100; };
global.timeSystem = { gameTime: { currentDay: 7, totalMinutes: 0 }, advanceTime: function () {}, getAbsoluteDay: function () { return 100; }, onNewDaySubscribe: function () {} };
global.inventory = { slots: [], currency: { spiritStones: 999999, copper: 0 } };
global.currentCharData = { name: '套利探针', realm: '元婴', location: '金城', lifeSkills: {} };
// window.playerReputation 全仓零写入者（只有 enhanced-shop.js:132 读它）→ 按不存在计，不虚报买价折扣
global.playerReputation = 0;

load('js/location-system.js');       // 真 cityData（23 座城＋建筑表＋买卖系数）
load('js/core/world-loop.js');
load('js/extensions/market-dynamic.js');
load('js/reputation-system.js');
load('js/world-events.js');
load('js/data.js');
load('js/items.js');                 // window.itemById 由 js/items.js:728-768 建成
// 扩展物品包：真页在 items.js 之后按 仙侠.html:1971-1991 那一串顺序加载，货架抽的就是这张 itemById——
// 只装基础 40 件等于普查了六分之一货架
['01-pills', '02-weapons', '03-armor', '04-materials', '05-talismans', '06-arts', '07-food', '08-special']
    .forEach(function (f) { load('js/items-extended/' + f + '.js'); });
load('js/items-extended.js');        // 合并进 window.itemById（js/items-extended.js:46-52）
load('js/items-extended/13-missing-ids.js');
load('js/items-extended/14-ability-manuals.js');
load('js/items-extended/15-root-refine.js');
load('js/items-extended/16-dangling-ids.js');
load('js/items-extended/17-lead-tokens.js');
load('js/items-extended/18-grade-expansion.js');
load('js/enhanced-shop.js');

var T = global.TradeService;
var LS = global.locationSystem;
assert(!!T && !!LS && typeof global.getAllItemTemplates === 'function' && Object.keys(global.itemById).length > 300,
    '装载齐全：TradeService／真 cityData／真货表（基础＋扩展 ' + Object.keys(global.itemById).length + ' 件）');

// 柜台＝该城真有这枚建筑（门在 location-system.js:895-898 的 shopTypes 表）
var BUILDING_TO_SHOP = { shop: 'general', medicine_shop: 'medicine', talisman_shop: 'talisman', weapon_shop: 'weapon', armor_shop: 'armor', art_shop: 'art', market: 'special', black_market: 'special' };
var counters = [];
Object.keys(LS.cityData).forEach(function (city) {
    var seen = {};
    (LS.cityData[city].buildings || []).forEach(function (b) {
        var t = BUILDING_TO_SHOP[b];
        if (!t || seen[t]) return;
        seen[t] = 1;
        counters.push({ city: city, type: t });
    });
});

function maxedProfile() {
    global.currentCharData.lifeSkills = { '口才': 100 };
    counters.forEach(function (c) { try { global.addReputation(c.city, 50000); } catch (e) {} });
}
function baselineProfile() {
    global.currentCharData.lifeSkills = {};
    counters.forEach(function (c) { try { global.setReputation(c.city, 0); } catch (e) {} });
}
function freshShops() {
    global.initShopSystem();
    return counters.map(function (c) {
        var id = global.ensureCityShop(c.city, c.type);
        var shop = global.shopManager.getShop(id);
        return shop ? { key: c.city + '/' + c.type, id: id, shop: shop } : null;
    }).filter(Boolean);
}
// 当日最低波动那一档（玩家挑日子扫货是真打得出来的）
function lowDayPrice(shop, item) {
    var real = Math.random; Math.random = function () { return 0; };
    var p = shop.getItemPrice(item);
    Math.random = real; return p;
}
var uidSeq = 0;
function sellQuote(shops, key, templateId) {
    var slot = { uid: 'u_t' + (++uidSeq), templateId: templateId, count: 1, getTemplate: function () { return global.itemById[templateId]; } };
    global.inventory.slots.push(slot);
    var s = null;
    for (var i = 0; i < shops.length; i++) if (shops[i].key === key) { s = shops[i]; break; }
    var q = s ? T.quoteSell(s.id, slot.uid, 1, true) : null;
    global.inventory.slots.pop();
    return q;
}

// ==================== A 结构账 ====================
console.log('\n[A] 封顶这一道真在结算里');
var es = src('js/enhanced-shop.js');
assert(es.indexOf('var capUnitPrice = shelfEntry ? shop.getItemPrice(shelfEntry) : basePrice;') >= 0, 'A1 顶的取法在报价式之后（取本柜当日售价，无此货取行价）');
assert(es.indexOf('if (capUnitPrice > 0 && finalUnitPrice > capUnitPrice) finalUnitPrice = Math.max(1, capUnitPrice);') >= 0, 'A2 单价被顶住那一行写在 settle 之前（不是只念个 toast）');
assert(es.indexOf('capUnitPrice: capUnitPrice') >= 0 && es.indexOf('rawUnitPrice: rawUnitPrice') >= 0, 'A3 报价单带着顶与前价（明细与断言都读得到）');
assert(es.indexOf('var totalPrice = finalUnitPrice * quantity;') > es.indexOf('if (capUnitPrice > 0'), 'A4 总价用封顶后的单价算（顺序错了＝屏上改了账上没改）');
assert(/柜上封顶/.test(es), 'A5 被封顶那一行有字面上屏的话术');
assert(src('tests/run-all.sh').indexOf('wave113-buyback-cap-node.js') >= 0, 'A6 本套件已入回归清单（没进 run-all 的套件等于没跑）');

// ==================== B 普查账（满级号：口才 100 ＋ 每城万人敬仰）====================
console.log('\n[B] 全柜台普查：同柜原地转卖净 ≤ 0');
maxedProfile();
var shops = freshShops();
assert(shops.length === counters.length, 'B1 柜台数＝真建筑表数（' + shops.length + '）');
var combos = 0, positive = 0, preFixPos = 0, violations = 0, worst = 0, worstName = '';
shops.forEach(function (s) {
    (s.shop.inventory || []).forEach(function (it) {
        if (!it || !(it.basePrice > 0)) return;
        var buy = lowDayPrice(s.shop, it);
        var q = sellQuote(shops, s.key, it.id);
        if (!q || !(buy > 0)) return;
        combos++;
        var net = q.finalUnitPrice - buy;
        if (net > 0) { positive++; }
        if (q.rawUnitPrice > buy) preFixPos++;
        if (q.finalUnitPrice > buy) {
            if (violations < 5) console.log('  ⚠ 越线：' + s.key + ' ' + it.id + ' 买 ' + buy + ' → 回购 ' + q.finalUnitPrice);
            violations++;
        }
        if (q.finalUnitPrice / buy > worst) { worst = q.finalUnitPrice / buy; worstName = (global.itemById[it.id] || {}).name + ' @' + s.key; }
    });
});
console.log('  组合 ' + combos + ' 条，原地转卖为正：' + positive + ' 条；最高倍率 ' + worst.toFixed(3) + '×（' + worstName + '）');
console.log('  同一套画像下封顶前那条链为正：' + preFixPos + ' 条（这一支不为绿而存在——它证明普查不是空转）');
assert(combos > 1200, 'B3 普查规模够（' + combos + ' 条真柜台×真货架；掉到三位数＝扩展物品包没装上，那样只普查了六分之一货架）');
assert(preFixPos >= 200 && preFixPos <= 340, 'B5 改前印钞口数在探针画像里正常出现（装齐货表后复现 268~272 条；实际 ' + preFixPos + ' 条——掉了说明折扣接线变了，B4 的 0 就成了假绿）');
assert(violations === 0, 'B2 全普查无一条回购高于本柜买价（越线 ' + violations + ' 条）');
assert(positive === 0, 'B4 一条原地印钞口都不剩（改前每代约 219 条为正，现算脚本 .scratch/v24-DE-prefix.cjs）');

// ==================== C 病例账 ====================
console.log('\n[C] 改前那三条读数逐条压回');
// 货架是每日随机生成的，指名「今天这柜必有筑基丹」的断言会自己抽风——
// 按病例重开柜台（最多 30 次）直到这件货真上柜；30 次仍没有则如实记缺，不算通过也不算失败。
// ⚠ 认病例只认 id，不认名字：装齐扩展包后全表 512 件，光「筑基丹」就有三枚
//   （foundation_pill 行价 500／pill_foundation 500／pill_zhuji 200）。按名字认曾撞到 pill_zhuji，
//   那枚 买 94 → 收 54 本来就不是印钞口，断言当场红——红得对，是认货认错了。
function findOnShelf(key, itemId, maxTries) {
    for (var t = 0; t < (maxTries || 30); t++) {
        var list = freshShops();
        for (var i = 0; i < list.length; i++) {
            if (list[i].key !== key) continue;
            var shelf = (list[i].shop.inventory || []);
            for (var j = 0; j < shelf.length; j++) {
                if (shelf[j].id === itemId) return { it: shelf[j], entry: list[i], shops: list };
            }
        }
    }
    return null;
}
var cases = [
    { key: '青木城/medicine', id: 'foundation_pill', rank: '改前同柜最高一档（约 1.4~1.6×）' },
    { key: '青木城/medicine', id: 'pill_big_recovery', rank: '小额高频那一条（约 1.5×，新手买得起也卖得动）' },
    // 绝对读数每天跟着货架随机浮动（同一件货两次跑可以是 47→68 也可以是 57→81），所以名次只标倍率档，
    // 具体两个价看本次日志——C 段断言用的 rawUnitPrice 也是现算的，不抄任何一次的数。
    { key: '青木城/general', id: 'flying_sword', rank: '同柜 1.2~1.3×（跨柜另有 1.7~2.1×，见 E 段）' }
];
var caseHit = 0;
cases.forEach(function (cs) {
    var nm = nameOf(cs.id);
    var found = findOnShelf(cs.key, cs.id);
    if (!found) { console.log('  ○ ' + nm + '(' + cs.id + ') @' + cs.key + '：重开 30 日货架都没上柜（随机生成），本波未复现'); return; }
    caseHit++;
    var buy = lowDayPrice(found.entry.shop, found.it);
    var q = sellQuote(found.shops, cs.key, cs.id);
    assert(!!q, 'C ' + nm + ' 柜上收（报价单开得出）');
    if (!q) return;
    // 改前的读数不抄笔记：报价单自己带着封顶前那个价
    assert(q.rawUnitPrice > buy, 'C ' + nm + '(' + cs.id + ') @' + cs.key + ' 改前确为原地印钞口（本柜买 ' + buy + '，封顶前柜上收 ' + q.rawUnitPrice + '）');
    assert(q.finalUnitPrice <= buy, 'C ' + nm + ' 同柜转卖 买 ' + buy + ' → 卖 ' + q.finalUnitPrice + ' 不赚（改前 ' + buy + '→' + q.rawUnitPrice + '）');
    assert(q.rawUnitPrice >= q.finalUnitPrice, 'C ' + nm + ' 封顶前价 ' + q.rawUnitPrice + ' ≥ 封顶后 ' + q.finalUnitPrice + '（顶只压不抬）');
    console.log('  ' + nm + '(' + cs.id + ') @' + cs.key + '（' + cs.rank + '）：改前 买 ' + buy + ' → 卖 ' + q.rawUnitPrice + '｜改后 买 ' + buy + ' → 卖 ' + q.finalUnitPrice);
});
assert(caseHit >= 1, 'C 病例至少复现一条（本次复现 ' + caseHit + '/3）');

// ==================== D 不误伤 ====================
console.log('\n[D] 基线号一件都不该被封顶／柜上没收的货照旧');
baselineProfile();
var shops2 = freshShops();
var cappedBaseline = 0, scanned2 = 0;
shops2.forEach(function (s) {
    (s.shop.inventory || []).forEach(function (it) {
        if (!it || !(it.basePrice > 0)) return;
        var q = sellQuote(shops2, s.key, it.id);
        if (!q) return;
        scanned2++;
        if (q.finalUnitPrice < q.rawUnitPrice) cappedBaseline++;
    });
});
assert(cappedBaseline === 0, 'D1 基线号（口才 0／声望 0）扫 ' + scanned2 + ' 条，被封顶 0 条——这道顶只管折扣叠满的号');
// 本仓没有的货（战利品）：仍按乘数走，但不高于行价
var lootId = null;
Object.keys(global.itemById).forEach(function (k) {
    var tpl = global.itemById[k];
    if (!lootId && tpl && (tpl.price || tpl.basePrice) >= 200 && tpl.category !== 'quest' && tpl.subtype !== 'manual') lootId = k;
});
var lootTpl = global.itemById[lootId];
var anyStocked = shops2.some(function (s) { return (s.shop.inventory || []).some(function (it) { return it.id === lootId; }); });
var lq = sellQuote(shops2, shops2[0].key, lootId);
if (lq) {
    assert(lq.finalUnitPrice <= Math.max(1, lootTpl.price || lootTpl.basePrice), 'D2 一件货的回购不高于行价（' + lootId + ' 行价 ' + (lootTpl.price || lootTpl.basePrice) + '，报价 ' + lq.finalUnitPrice + '，本柜有货＝' + anyStocked + '）');
} else {
    assert(false, 'D2 战利品报价开不出来（' + lootId + '）');
}

// ==================== E 设计保留：跨城脚程换差价 ====================
console.log('\n[E] 跨城差价仍在（跑单帮不是病，原地连点才是）');
maxedProfile();
var shops3 = freshShops();
// 先一趟钉死每柜每货的当日最低买价，再算跨柜报价——getItemPrice 按「柜+货+日」缓存，
// 同一趟里边算报价边取买价，被封顶那一道读过的货就把随机波动价烘进缓存，两边的价都不再是当日最低那档
// （.scratch/v24-DE-prefix.cjs 头一版同趟取数，改前条数直接少算一半）。
var buyPinned = {};
shops3.forEach(function (s) {
    (s.shop.inventory || []).forEach(function (it) {
        if (!it || !(it.basePrice > 0)) return;
        buyPinned[s.key + '|' + it.id] = lowDayPrice(s.shop, it);
    });
});
var cross = 0, overTag = 0, crossBest = 0, crossBestTxt = '';
function nameOf(id) { return ((global.itemById[id] || {}).name || id) + '<' + id + '>'; }
shops3.forEach(function (s) {
    (s.shop.inventory || []).forEach(function (it) {
        if (!it || !(it.basePrice > 0)) return;
        var buy = buyPinned[s.key + '|' + it.id];
        var best = 0, bestAt = '';
        shops3.forEach(function (t) {
            if (t.key === s.key) return;
            var q = sellQuote(shops3, t.key, it.id);
            if (q && q.finalUnitPrice > best) { best = q.finalUnitPrice; bestAt = t.key; }
        });
        if (best > buy) {
            cross++;
            if (buy > 0 && best / buy > crossBest) { crossBest = best / buy; crossBestTxt = nameOf(it.id) + '：' + s.key + ' 买 ' + buy + ' → ' + bestAt + ' 卖 ' + best; }
        }
        if (best > it.basePrice) { overTag++; console.log('  ⚠ 回购高于行价：' + it.id + ' 行价 ' + it.basePrice + ' 卖@' + bestAt + ' ' + best); }
    });
});
console.log('  跨柜为正 ' + cross + ' 条；封顶后最高 ' + crossBest.toFixed(2) + '×（' + crossBestTxt + '）');
console.log('    （改前未封顶那条链的跨柜最高在 1.7~2.1×——本顶削掉的是「到了目的柜还能原地再赚一口」那一层，脚程差价本身留着）');
assert(cross > 0, 'E1 跨城仍有差价可赚（' + cross + ' 条）——这条是设计，封顶不碰它');
assert(overTag === 0, 'E2 但任何柜台的回购都不高于该行价（' + overTag + ' 条越线）');

// ==================== F 屏上账：报价明细念封顶 ====================
console.log('\n[F] 被封顶时明细念出那一行');
var cappedQuote = null;
(function () {
    var shopObj = null;
    for (var i = 0; i < shops.length && !cappedQuote; i++) {
        shopObj = shops[i];
        var shelf = (shopObj.shop.inventory || []).filter(function (x) { return x && x.basePrice > 0; });
        for (var j = 0; j < shelf.length; j++) {
            var q = sellQuote(shops, shopObj.key, shelf[j].id);
            if (q && q.finalUnitPrice < q.rawUnitPrice) { cappedQuote = q; break; }
        }
    }
})();
assert(!!cappedQuote, 'F1 满级号下确有被封顶的报价（' + (cappedQuote ? cappedQuote.itemName + ' 原算 ' + cappedQuote.rawUnitPrice + ' → ' + cappedQuote.finalUnitPrice : '无') + '）');
if (cappedQuote) {
    var madeBefore = madeEls.length;
    global.showQuoteDetail(cappedQuote);
    var body = '';
    for (var mi = madeBefore; mi < madeEls.length; mi++) body += (madeEls[mi].innerHTML || '');
    assert(/柜上封顶/.test(body), 'F2 明细窗上屏有「柜上封顶」那一行');
    assert(body.indexOf(String(cappedQuote.rawUnitPrice)) >= 0, 'F3 明细把封顶前那个价也念出来（因子连乘不等于单价，得说清为什么）');
    var m = /柜上封顶<\/span><span[^>]*>([^<]+)</.exec(body);
    console.log('  封顶行：' + (m ? m[1] : '（未渲染）'));
}

console.log('\nwave113-buyback-cap：' + passed + ' 通过 / ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
