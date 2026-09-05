/**
 * v20.44-house-node.js — 洞府做深验收：
 * 灵植不等懒汉（熟后三日不采即蔫、收成减半）；家具死字段通电
 * （蒲团修炼/暖玉炉灵田/聚灵灯储物，真加成真扣）；家具随档往返。
 *
 * 运行：node tests/v20.44-house-node.js
 */
'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var passed = 0, failed = 0;
function assert(cond, msg) {
    if (cond) passed++;
    else { failed++; console.error('[FAIL] ' + msg); }
}
function loadScript(rel) { return fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8'); }

function makeWorld(stones) {
    var state = { day: 100 };
    var msgs = [], added = [];
    var w = {
        console: { log: function () {}, warn: function () {}, error: function () {} },
        JSON: JSON, Object: Object, Array: Array, Math: Math, Number: Number, String: String,
        localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
        inventory: { currency: { spiritStones: stones != null ? stones : 10000 }, slots: [], maxSlots: 30 },
        showMessage: function (m) { msgs.push(String(m)); },
        addItem: function (id, n) { added.push({ id: id, n: n }); },
        updateCurrencyUI: function () {}, renderHouseStatus: function () {},
        addProfessionExp: function () {}, getLifeSkill: function () { return 0; },
        getAbsoluteDay: function () { return state.day; },
        __msgs: msgs, __added: added, __state: state
    };
    w.window = w;
    var ctx = vm.createContext(w);
    vm.runInContext(loadScript('js/house-system.js'), ctx);
    return w;
}

// ============ H 购宅与灵田 ============
var W1 = makeWorld(10000);
assert(W1.buyHouse('cave') === true && W1.inventory.currency.spiritStones === 9000
    && W1.playerHouse.type === 'cave',
    'H1 购洞府：灵石真扣，名册落账');
assert(W1.plantCrop('spirit_grass') === true && W1.playerHouse.planted.length === 1
    && W1.playerHouse.planted[0].readyDay === 102,
    'H2 灵草入田：免种，两日后熟（日账记真日）');
assert(W1.harvestCrop(0) === false && W1.__msgs.join('').indexOf('尚未成熟') >= 0,
    'H3 未熟不采——地里的日子没到');
W1.__state.day = 102;
assert(W1.harvestCrop(0) === true && W1.__added.length === 1 && W1.__added[0].n === 3,
    'H4 如期而收：灵草 x3，一分不少');

// ============ H 灵植不等懒汉 ============
var W2 = makeWorld(10000);
W2.buyHouse('cave');
W2.plantCrop('spirit_grass');
W2.__state.day = 106; // 熟后四日，过了三日宽限
assert(W2.harvestCrop(0) === true && W2.__added[0].n === 1
    && W2.__msgs.join('').indexOf('蔫') >= 0,
    'H5 蔫后才收：收成减半（3→1），账不白烂在地里');
var W2b = makeWorld(10000);
W2b.buyHouse('cave');
W2b.plantCrop('spirit_grass');
W2b.__state.day = 105; // 熟后三日整，仍在宽限
assert(W2b.harvestCrop(0) === true && W2b.__added[0].n === 3,
    'H6 宽限之内不算蔫——三日是三日，不多不少');

// ============ H 家具通电 ============
var W3 = makeWorld(10000);
W3.buyHouse('cave');
assert(W3.buyFurniture('mat') === true && W3.inventory.currency.spiritStones === 8200
    && Math.abs(W3.getHouseBonus('cultivation') - 1.15) < 1e-9,
    'H7 聚灵蒲团：真扣 800，洞府修炼 1.1→1.15（加成落真的）');
assert(W3.buyFurniture('mat') === false && W3.__msgs.join('').indexOf('已置办过') >= 0,
    'H8 家具不重购——同一件只置一次');
assert(W3.buyFurniture('lamp') === true && Math.floor(W3.getHouseBonus('storage')) === 15,
    'H9 聚灵灯：储物 10→15 格');
var W3b = makeWorld(300);
assert(W3b.buyFurniture('stove') === false, 'H10 无洞府不卖家具——先有宅，后有家');

// ============ H 随档往返 ============
var W4 = makeWorld(10000);
W4.buyHouse('courtyard');
W4.buyFurniture('stove');
W4.plantCrop('spirit_grass'); // 灵草免种（灵芝要种子，测试背包里没有）
var snap = W4.exportHouseState();
var W5 = makeWorld(0);
W5.importHouseState(snap);
assert(W5.playerHouse && W5.playerHouse.type === 'courtyard'
    && W5.playerHouse.furniture.indexOf('stove') >= 0
    && W5.playerHouse.planted.length === 1,
    'H11 洞府整体随档往返——宅、家具、田里的苗，一格不丢');

console.log('---');
console.log('v20.44 house: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
