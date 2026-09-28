/**
 * wave72-gift-tags-node.js — 第七十二波 · 送礼偏好标签接线 验收：
 *   A 标签来源：全部取自物品显式字段（category/subtype/element），不读展示名
 *   B 真物品覆盖：丹药/武器/古籍/草药/矿石/灵石/食物/符箓 那几类偏好能命中在库物品
 *   C 少数件背书：药酒算酒肉、化毒两枚算解毒丹（按 id 声明，非按名字猜）
 *   D 偏好判定：投其所好命中 multiplier、投其所恶走减半、无名之物不命中
 *   E 哨兵：源码无「按 name 正则/包含判机制」的笔、无查无此物的旧 id 白名单
 *
 * 运行：node tests/wave72-gift-tags-node.js
 */
'use strict';

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { assert(a === b, msg + '（实际=' + JSON.stringify(a) + ' 期望=' + JSON.stringify(b) + '）'); }
function has(arr, v, msg) { assert(Array.isArray(arr) && arr.indexOf(v) >= 0, msg + '（标签=' + JSON.stringify(arr) + '）'); }

// ==================== 世界桩 ====================
const sandbox = { console: { log() {}, warn() {}, error() {} }, window: null, document: undefined };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

function run(rel) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel });
}
run('js/items.js');
for (const f of fs.readdirSync(path.join(ROOT, 'js/items-extended')).sort()) run('js/items-extended/' + f);
run('js/items-extended.js');
run('js/npcs/item-tags.js');

const itemById = sandbox.itemById;
const getItemNPCTags = sandbox.getItemNPCTags;
const checkNPCLikeItem = sandbox.checkNPCLikeItem;

assert(itemById && Object.keys(itemById).length > 200, '物品表在册：' + Object.keys(itemById).length + ' 件');
eq(typeof getItemNPCTags, 'function', 'getItemNPCTags 已挂上');

// ==================== A 标签来源 ====================
const pillIds = Object.keys(itemById).filter(id => itemById[id].subtype === 'pill');
has(getItemNPCTags(pillIds[0]), '丹药', '丹药类（subtype=pill）打出「丹药」：' + pillIds[0]);
const swordIds = Object.keys(itemById).filter(id => itemById[id].subtype === 'sword');
has(getItemNPCTags(swordIds[0]), '武器', '剑类（subtype=sword）打出「武器」：' + swordIds[0]);
const artIds = Object.keys(itemById).filter(id => itemById[id].category === 'secret_art' || itemById[id].type === 'secret_art');
has(getItemNPCTags(artIds[0]), '古籍', '秘籍类打出「古籍」：' + artIds[0]);
const iceTalisman = itemById['tal_icicle'];
assert(iceTalisman && iceTalisman.effect.element === 'ice', '冰锥符在册，属性写在 effect.element 上');
has(getItemNPCTags('tal_icicle'), '冰属性物品', 'effect.element=ice → 打出「冰属性物品」');
eq(getItemNPCTags('tal_icicle').indexOf('冰属性材料'), -1, '冰锥符是消耗品，不打「冰属性材料」');
has(getItemNPCTags('fire_dao'), '火属性物品', 'damageType=fire → 打出「火属性物品」');
has(getItemNPCTags('wpn_feng_sword'), '武器', 'category=weapon → 武器（风灵剑的 category 不是 equipment）');
has(getItemNPCTags('wpn_feng_sword'), '装备', 'category=weapon → 也吃「装备」偏好（沿用旧手写表的口径）');
has(getItemNPCTags('manual_venom'), '古籍', 'subtype=manual → 万毒真经算古籍（它的 category 只是 consumable）');
has(getItemNPCTags('manual_venom'), '书籍', 'subtype=manual → 书籍');
has(getItemNPCTags('special_poison'), '毒药', 'subtype=poison → 毒药（不再靠猜名字点亮这一类）');
eq(getItemNPCTags('iron_sword').indexOf('火属性物品'), -1, 'damageType=slash 是挥砍类型，不当属性用');
eq(getItemNPCTags('no_such_item_xyz').length, 0, '查无此物 → 空标签，不猜');
eq(getItemNPCTags('').length, 0, '空 id → 空标签');

// ==================== B 偏好类目命中率 ====================
const WANTED = ['丹药', '武器', '古籍', '草药', '矿石', '灵石', '食物', '符箓', '火属性物品', '炼丹材料', '解毒丹', '酒肉', '毒药'];
function hitsOf(cat) {
    return Object.keys(itemById).filter(id => getItemNPCTags(id).indexOf(cat) >= 0).length;
}
for (const cat of WANTED) {
    assert(hitsOf(cat) > 0, '类目「' + cat + '」能命中在库物品：' + hitsOf(cat) + ' 件');
}
// 设计缺口在册：这几类偏好没有任何物品带显式标签，不许靠猜名字点亮
// （「毒药」原本也在这里——`subtype:'poison'` 补进映射表后已转红又挪回命中清单，这条注释是那段历史的墓碑）
for (const gap of ['冰属性材料', '佛经', '赃物', '现代法器']) {
    eq(hitsOf(gap), 0, '类目「' + gap + '」仍无显式标签背书（物品表补上显式属性标/新物品后这条会转红，届时把它挪回命中清单）');
}

// ==================== C 少数件按 id 背书 ====================
has(getItemNPCTags('food_thousand_wine'), '酒肉', '千里醇按 id 声明为酒肉');
has(getItemNPCTags('pill_antidote'), '解毒丹', '化毒丹按 id 声明为解毒丹');
has(getItemNPCTags('pill_poison_resist'), '解毒丹', '辟毒散按 id 声明为解毒丹');

// ==================== D 偏好判定 ====================
const monkLike = { preferences: { likedItems: [{ category: '丹药', multiplier: 3 }], dislikedItems: [] } };
const wine = itemById['food_crane_wine'];
const pill = itemById[pillIds[0]];
let r = checkNPCLikeItem(monkLike, { id: pill.id, name: pill.name });
eq(r.liked, true, '投其所好 → liked=true');
eq(r.multiplier, 3, '投其所好 → 用偏好表声明的倍率 3');
assert(/眼睛一亮/.test(r.feedback), '投其所好 → 有专属反馈文案');
r = checkNPCLikeItem(monkLike, { id: wine.id, name: wine.name });
eq(r.liked, null, '不属偏好类目 → 不咸不淡');
const hater = { preferences: { likedItems: [], dislikedItems: [{ category: '酒肉', multiplier: 0.5 }] } };
r = checkNPCLikeItem(hater, { id: wine.id, name: wine.name });
eq(r.liked, false, '投其所恶 → liked=false');
eq(r.multiplier, 0.5, '投其所恶 → 减半');
r = checkNPCLikeItem(null, null);
eq(r.liked, null, '缺 NPC 或缺物品 → 不报错、按中性');

// ==================== E 哨兵 ====================
const tagSrc = fs.readFileSync(path.join(ROOT, 'js/npcs/item-tags.js'), 'utf8');
assert(!/\.name\.(includes|match|indexOf|search)/.test(tagSrc), 'item-tags.js 内无「按展示名判机制」的笔');
assert(!/ITEM_NPC_TAGS/.test(tagSrc), '旧的 53 条幽灵 id 白名单已撤净');
assert(!/\bnew RegExp\b/.test(tagSrc), 'item-tags.js 内无正则猜测');
const ghostIds = Object.keys(sandbox.ITEM_GIFT_TAG_OVERRIDES || {}).filter(id => !itemById[id]);
eq(ghostIds.length, 0, '少数件背书表里的 id 全在物品表内' + (ghostIds.length ? '，悬空：' + ghostIds.join(',') : ''));

// ==================== F 全量背书棘轮（量的是整本物品表 × 真映射表） ====================
const ALL_IDS = Object.keys(itemById);
const 零标 = ALL_IDS.filter(id => !getItemNPCTags(id).length);
eq(零标.length, 0, '在册 ' + ALL_IDS.length + ' 件物品零漏网：每件至少打上一个标' + (零标.length ? '，漏：' + 零标.slice(0, 6).join(',') : ''));
const PREF_CATS = ['丹药', '武器', '古籍', '草药', '矿石', '灵石', '食物', '炼丹材料', '解毒丹', '酒肉', '毒药', '火属性物品', '装备', '消耗品', '材料', '饰品', '符箓', '书籍', '乐器', '信物', '任务物品', '锻造材料', '冰属性物品', '雷属性物品', '风属性物品', '杂物'];
let 配对 = 0;
const 每类 = {};
for (const c of PREF_CATS) { 每类[c] = hitsOf(c); 配对 += 每类[c]; }
// 两处读数别混：**只数 NPC 名册里真声明了偏好的那 16 个类目**时，配对数 8 → **349**（量法 `.scratch/gift-pairs-real.mjs`）；
// 上面 PREF_CATS 用的是 26 个标签全集，同一把尺读 **1043**。下面钉的是**下限**不是等号：
// 日后加物品只会往上走，往下掉才是要拦的东西。
assert(配对 >= 300, '类目×物品配对数棘轮：' + 配对 + ' ≥ 300（旧手写表只有 8）');
assert(每类['毒药'] >= 3, '「毒药」由 subtype 显式背书：' + 每类['毒药'] + ' 件');
assert(每类['古籍'] >= 60, '「古籍」背书：' + 每类['古籍'] + ' 件（含 9 本 subtype=manual 的扩展功法书）');
assert(每类['武器'] >= 90, '「武器」背书：' + 每类['武器'] + ' 件（含 category=weapon 那一支）');

console.log('\n通过 ' + passed + ' / 失败 ' + failed);
process.exit(failed ? 1 : 0);
