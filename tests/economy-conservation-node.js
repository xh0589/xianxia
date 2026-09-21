// economy-conservation-node.js — 第三十一波 · 经济守恒总账哨兵
// 全库钱口子（addSpiritStones 直达点）已逐处过目归账，本套把「每个口子都有闸」钉死成回归断言：
// 往后谁改动这几处、把闸拆了（可重复白拿/不扣货/无概率门），这里当场红。
// 五类分账：转化（卖货先扣货）/ 劳动+风险（悬赏一单一领）/ 一次性任务 / 天道小额福报（有骰有额顶）/ 资产产出（有波动有风险）
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
function src(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

let pass = 0, fail = 0;
function ok(cond, name) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.error('  ✗ ' + name); }
}

console.log('\n[A] 转化类：卖货/退货必须先扣货再进钱（钱货两讫）');
{
    const gala = src('js/sects/sect-gala.js');
    const iConsume = gala.indexOf("consumeItem(itemId, 1)");
    const iAdd = gala.indexOf('addSpiritStones(half)');
    ok(iConsume >= 0 && iAdd >= 0 && iConsume < iAdd && gala.includes('行囊里没这件东西了'), 'A1 盛会拍卖：先收货后落槌，没货不拍');
    const shop = src('js/enhanced-shop.js');
    ok(shop.includes('quote.totalPrice') && (shop.includes('removeItem') || shop.includes('consumeItem') || shop.includes('slots')), 'A2 坊市回售走报价与库存账（不是白印钱）');
    const city = src('js/city-depth.js');
    const iPrice = city.indexOf('addSpiritStones(w.price)');
    ok(iPrice >= 0 && city.slice(Math.max(0, iPrice - 600), iPrice).match(/count\s*--|splice|consume|remove|扣/), 'A3 街市出手先减行囊里的货');
    const cui = src('js/crafting/compound-ui.js');
    ok(cui.includes('_payRefund') && cui.includes('uninstall'), 'A4 洞府拆阵退料退款（退的是装进去的钱）');
}

console.log('\n[B] 劳动+风险类：悬赏一单一领、清剿按单结');
{
    const bb = src('js/quest/bounty-board.js');
    ok(bb.includes('b.completed') && bb.includes('b.claimed'), 'B1 悬赏单：没完成领不了、领过的领第二回（一单一领）');
    const iClaim = bb.indexOf('function claimBounty');
    const seg = bb.slice(iClaim, iClaim + 800);
    ok(seg.indexOf('b.claimed') < seg.indexOf('addSpiritStones'), 'B2 领过的闸在进钱之前落下');
    const shield = src('js/sects/sect-shield-errands.js');
    ok(shield.includes('addC') || shield.includes('addSpiritStones'), 'B3 护山差事的酬金走既有账口（口径在档）');
}

console.log('\n[C] 天道福报与机缘：有骰、有额顶、不刷屏');
{
    const karma = src('js/core/karma-retribution.js');
    ok(karma.includes('roll < 0.15') && karma.includes('addSpiritStones(10)'), 'C1 善报是每日一骰的一成半、十枚封顶（路人赠礼有名目）');
    ok(karma.includes('karma >= 50'), 'C2 福报只落给积了善业的——不是人人有份的印钞机');
    const ev = src('js/event-system.js');
    const iAdd = ev.indexOf('addSpiritStones(amount)');
    ok(iAdd >= 0 && ev.slice(Math.max(0, iAdd - 1500), iAdd).match(/amount|机缘|拾得|赠/), 'C3 事件拾遗有金额有名目（一次性机缘）');
}

console.log('\n[D] 资产产出类：灵脉日产有涨落、有夜袭，不是点击回本机');
{
    const sv = src('js/economy/spirit-vein.js');
    ok(sv.includes('0.8 + Math.random() * 0.4'), 'D1 产出随灵潮涨落（±两成）');
    ok(sv.includes('偷采') && sv.includes('gain = Math.floor(gain / 2)'), 'D2 低阶灵脉有散修夜袭分流（产出会折半）');
    ok(sv.includes('dailyOutput: 20') && sv.includes('(v.baseOutput || 20) + (v.tier - 1) * 15'), 'D3 产出额顶在档（菜单脉一阶日产二十，升阶按基数长、要真本钱）');
    // 第三十五波：地图脉眼产出更高（一重25/二重35/三重50），但闸也更多——逐条钉死
    ok(sv.includes('MAP_LEY_OUTPUT = { 1: 25, 2: 35, 3: 50 }'), 'D4 地图脉产出定档在册（三重50 顶天，升级台阶与菜单同规）');
    ok(sv.includes('tier < 3') && sv.includes('deductSpiritStones(cost)'), 'D5 夺脉有境界闸（金丹）且真扣灵石——高出部分是脚钱和风险钱');
    ok(sv.includes('old.location') && sv.includes('一处根基足矣'), 'D6 单脉限制：已占地图脉再夺被拒（不叠两份产出）');
    ok(sv.includes('MOVE_COST = 600'), 'D7 菜单脉迁地图脉折价过户（合并不叠加，账上永远一本）');
}

console.log('\n[E] 两讫真账类（十九至三十波新系统）：钱都从对方账上真扣');
{
    const war = src('js/sects/sect-war.js');
    ok(war.includes('itSpoil.resources') && war.includes('spoils'), 'E1 攻山缴获真从对方库房扣（穷门抄不出富账）');
    ok(war.includes('Math.min(100, Math.floor((Number(it.resources) || 0) * 0.12))'), 'E2 驰援谢礼真从受援方库房出、有封顶');
    const mt = src('js/sects/master-teach.js');
    ok(mt.includes('_purse') && mt.includes('Math.min'), 'E3 弟子月寄是从自己荷包里掏（先挣后寄，寄不出荷包里没有的）');
    const life = src('js/extensions/player-sect-life.js');
    ok(life.includes('spendTreasury(sect.name, m.cost') && life.includes('spendTreasury(sect.name, CHARM_COST') && life.includes('spendTreasury(sect.name, WEDDING_COST') && life.includes('spendTreasury(ps.name, FUNERAL_COST'), 'E4 采买本钱/护身符/婚仪/治丧四笔都先出库后办事（库空办不成）');
    ok(life.includes('gainTreasury(sect.name, sectShare') && life.includes('gainTreasury(sect.name, windfall'), 'E5 镖钱与山珍入宗库都走真账口（来路名目在册）');
    const psw = src('js/extensions/player-sect-world.js');
    ok(psw.includes('gainTreasury') && psw.includes('drainTreasury') && psw.includes('_lastMirror'), 'E6 宗库两本账（真账与户部镜像）对齐的闩还在');
}

console.log('\n========== 第三十一波 · 经济守恒总账哨兵 ==========');
console.log('通过：' + pass + '　失败：' + fail);
process.exit(fail ? 1 : 0);
