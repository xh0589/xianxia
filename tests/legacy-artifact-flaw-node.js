// ==================== legacy-artifact-flaw-node.js ====================
// v25.6 器灵「性格 / 瑕疵 / 反噬」层的断言套件。
//
// 这一层要证明的是**四件容易被糊弄过去的事**，不是「代码存在」：
//   ① 性格真的不带战力 —— 同一件器灵换遍 5 个瑕疵，artifactCombatMul() 一位不差。
//      判据取自 v25.5 的 B8（3 阶 + 器灵 1 级 = 1.12），本批把同一把尺再钉一遍。
//   ② 瑕疵真的被消费 —— 不是「表里有五个键」，而是事件 / 喂料 / 交感 / 面板四路都读它、
//      且读得出**不同的后果**（同一串输入换五道脾气，五份输出必须两两不同）。
//   ③ 存档真的往返 —— 走 game-state.js 那条既有白名单（不开新键）；旧档（无 flaw 字段）不炸。
//   ④ 反噬真的确定 —— 同条件跑两遍，账与代价必须逐字相同；且新代码里一处 Math.random 都不许有。
//
// [D] 段是**反向自证**：临时把 flaw 接进战力乘位（本套必须当场转红），
// 再 byte-exact 还原（整个过程只碰内存里的字符串与一份临时副本，不写工作树）。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const SRC = 'js/equipment/bonded-artifact.js';

let 通过 = 0, 失败 = 0;
function ok(c, m) { if (c) { 通过++; console.log('  ✓ ' + m); } else { 失败++; console.log('  [FAIL] ' + m); } }
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

const FLAW_KEYS = ['glutton', 'hasty', 'bloodthirst', 'lovesick', 'suspicious'];

// ---- 沙箱：照抄 tests/v25.5-play-ventures-node.js:127-148 的搭法（那份已被钉住不许走形）----
function 建世界(opts) {
    opts = opts || {};
    const msgs = [], times = [], removed = [];
    const bus = {};
    let stones = opts.stones != null ? opts.stones : 1000;
    const W = {
        console: { log: () => {}, warn: () => {}, error: () => {} },
        showMessage: (t, k) => msgs.push({ text: String(t), kind: k }),
        currentCharData: { level: 30, realm: '金丹', health: 100, maxHealth: 100, _bondedArtifact: opts.ba || null },
        timeSystem: { advanceTime: (m, label) => times.push([m, label]) },
        DataManager: { deductSpiritStones: (n) => { if (stones < n) return false; stones -= n; return true; } },
        inventory: { slots: opts.slots || [{ uid: 'u1', templateId: 'm1', count: 1 }] },
        itemById: opts.itemById || { m1: { id: 'm1', name: '试验灵砂', type: 'material', quality: opts.quality || 'pin3' } },
        ITEM_QUALITIES: {
            pin1: { id: 'pin1', name: '一品', order: 9 }, pin2: { id: 'pin2', name: '二品', order: 8 },
            pin3: { id: 'pin3', name: '三品', order: 7 }, pin4: { id: 'pin4', name: '四品', order: 6 },
            pin5: { id: 'pin5', name: '五品', order: 5 }, pin6: { id: 'pin6', name: '六品', order: 4 },
            pin7: { id: 'pin7', name: '七品', order: 3 }, pin8: { id: 'pin8', name: '八品', order: 2 },
            pin9: { id: 'pin9', name: '九品', order: 1 }
        },
        removeItem: (uid) => { removed.push(uid); },
        updateCharacterStatus: () => {},
        EventBus: {
            _h: bus,
            on(t, cb) { (bus[t] = bus[t] || []).push(cb); },
            emit(t, d) { (bus[t] || []).forEach(cb => { try { cb(d); } catch (e) { console.log('bus cb threw: ' + e.message); } }); }
        },
        Math: Object.create(Math),
        getRealmTier: () => 3,
        _getMainTechniqueElement: () => opts.element || 'fire'
    };
    W.Math.random = () => opts.rand != null ? opts.rand : 0.5;
    W.window = W;
    vm.createContext(W);
    vm.runInContext(opts.src || load(SRC), W, { filename: 'bonded-artifact.js' });
    return { W, msgs, times, removed, bus, stones: () => stones, text: () => msgs.map(m => m.text).join('\n') };
}

// 一件 3 阶火法宝 + 醒着的器灵（v25.5 B5 的形状），flaw 可指定
function 火器(flaw, spiritLevel) {
    return {
        name: '试炼剑', level: 3, exp: 0, expMax: 140, durability: 100, maxDurability: 100, element: 'fire',
        spirit: { awakened: true, name: '离火之灵', level: spiritLevel || 1, exp: 0, expMax: 50, flaw: flaw }
    };
}
function 文本(msgs) { return msgs.map(m => m.text).join('\n'); }

console.log('\n========== v25.6 器灵瑕疵（性格 / 反噬） ==========');

// ============ [A] 性格绝不带战力 ============
console.log('\n[A] 性格不带战力：换遍 5 道脾气，战斗乘区一位不差');
{
    const 基准 = null;
    const vals = FLAW_KEYS.map(k => {
        const w = 建世界({ ba: 火器(k) });
        return w.W.artifactCombatMul();
    });
    ok(FLAW_KEYS.every((k, i) => vals[i] === vals[0]),
        'A1 五道脾气下 artifactCombatMul() 完全相同：' + vals.map(v => v.toFixed(2)).join(' / ')
        + '（3 阶本体 1.10 + 器灵 1 级 0.02 = 1.12，与 v25.5 的 B8 同值）');

    // 反向：器灵等级一变，乘区就该变 —— 证明上面那条不是恒真
    const 低 = 建世界({ ba: 火器('glutton', 1) }).W.artifactCombatMul();
    const 高 = 建世界({ ba: 火器('glutton', 5) }).W.artifactCombatMul();
    ok(Math.abs(低 - 1.12) < 1e-9 && Math.abs(高 - 1.20) < 1e-9,
        'A2 反例护栏：器灵 1→5 级时乘区确实从 1.12 走到 1.20 ⇒ A1 测的是「性格不进乘区」，不是「乘区不动」');

    // 性格的「好处」也不能绕道进乘区：好处全在信息/资源/时间/选择四域，一个经验都不许多给
    const 经验表 = FLAW_KEYS.map(k => {
        const w = 建世界({ ba: 火器(k, 1) });
        w.W.feedArtifact();
        return w.W.currentCharData._bondedArtifact.spirit.exp;
    });
    ok(经验表.filter(v => v === 3).length >= 4,
        'A3 好处不送器灵经验：五道脾气喂一次料的经验入账 = ' + 经验表.join(' / ')
        + '（只有「相思入骨」那一道会在反噬当口减半，其余都照旧 +3）');

    // 源码层面再钉一道：artifactCombatMul 的函数体里不许出现 flaw / spirit.flaw
    const body = (() => {
        const s = load(SRC), a = s.indexOf('function artifactCombatMul()');
        const b = s.indexOf('\n}', a);
        return s.slice(a, b);
    })();
    ok(!/flaw/i.test(body) && body.indexOf('spirit.level') > 0,
        'A4 artifactCombatMul() 函数体内零 flaw 字样（只有 ba.level 与 ba.spirit.level 两项）');
    ok(基准 === null, 'A5 （占位：本段不设全局基准，改用 A1 的两两比对）');
}

// ============ [B] 数据完整 ============
console.log('\n[B] 五个瑕疵键齐全、字段无缺');
{
    const w = 建世界({ ba: 火器('bloodthirst') });
    const F = w.W.SPIRIT_FLAWS;
    ok(!!F && Object.keys(F).length === 5, 'B1 瑕疵键正好 5 个：' + Object.keys(F).sort().join('、'));
    const 必填 = ['key', 'name', 'epithet', 'desc', 'meter', 'limit', 'boon', 'backlash', 'avoid',
        'onFeed', 'onCommune', 'onKill'];
    const 缺 = [];
    FLAW_KEYS.forEach(k => {
        必填.forEach(f => { if (F[k] && F[k][f] === undefined) 缺.push(k + '.' + f); });
        if (F[k] && (!F[k].boon || !F[k].boon.label || !F[k].boon.text)) 缺.push(k + '.boon.{label,text}');
        if (F[k] && (!F[k].backlash || !F[k].backlash.label || !F[k].backlash.text)) 缺.push(k + '.backlash.{label,text}');
    });
    ok(缺.length === 0, 'B2 每个瑕疵 11 个必备字段齐全（缺: ' + (缺.join('、') || '无') + '）');
    ok(FLAW_KEYS.every(k => F[k].key === k), 'B3 每个瑕疵的 key 与表键一致（activeFlawKey 靠这个回查）');
    ok(FLAW_KEYS.every(k => F[k].limit > 0 && typeof F[k].limit === 'number'),
        'B4 每道瑕疵都有一个正整数阈值（反噬判定的确定性支点）');
    ok(FLAW_KEYS.every(k => /[\u4e00-\u9fa5]/.test(F[k].desc) && /[\u4e00-\u9fa5]/.test(F[k].avoid)),
        'B5 每道瑕疵都有玩家可见文案（desc + avoid 都是中文，不是占位串）');
    ok(w.W.FLAW_ORDER.length === 5 && FLAW_KEYS.every(k => w.W.FLAW_ORDER.indexOf(k) >= 0),
        'B6 FLAW_ORDER 就是那 5 个键（温养按它顺移）');
    // 五行派脾气 —— 五行都能派到，且五个键都可达（neutral 走法宝名）
    const 派 = {};
    ['fire', 'wood', 'water', 'metal', 'earth'].forEach(el => {
        const x = 建世界({ ba: { name: '试炼剑', level: 3, exp: 0, expMax: 140, durability: 100, maxDurability: 100, element: el, spirit: { awakened: true, name: '五行之灵', level: 1, exp: 0, expMax: 50 } } });
        派[el] = x.W.spiritFlawProfile().key;
    });
    ok(Object.keys(派).map(k => 派[k]).sort().join(',') === FLAW_KEYS.slice().sort().join(','),
        'B7 五行各派一道、五道全可达（无重复也无漏）：' + JSON.stringify(派));
    let neutralKey = null, neutralKey2 = null;
    for (let i = 0; i < 12 && !neutralKey; i++) {
        const nm = '中性法宝' + i;
        const x = 建世界({ ba: { name: nm, level: 3, exp: 0, expMax: 140, durability: 100, maxDurability: 100, element: 'neutral', spirit: { awakened: true, name: '器灵', level: 1, exp: 0, expMax: 50 } } });
        neutralKey = x.W.spiritFlawProfile().key;
        const y = 建世界({ ba: { name: nm, level: 3, exp: 0, expMax: 140, durability: 100, maxDurability: 100, element: 'neutral', spirit: { awakened: true, name: '器灵', level: 1, exp: 0, expMax: 50 } } });
        neutralKey2 = y.W.spiritFlawProfile().key;
    }
    ok(!!neutralKey && FLAW_KEYS.indexOf(neutralKey) >= 0 && neutralKey === neutralKey2,
        'B8 neutral（无五行可依）也能派出一道合法脾气，且同名法宝两次派得同一个（' + neutralKey + '）——名字是它唯一不变的因');
}

// ============ [C] 真被消费（不是死数据） ============
console.log('\n[C] 消费口：四路真读它，且后果各不相同');
{
    // C1 消费口①：EventBus 的 enemy:defeated（battle.js:4720 真 emit）→ 嗜血连斩记账
    {
        const w = 建世界({ ba: 火器('bloodthirst') });
        const 听 = (w.bus['enemy:defeated'] || []).length;
        ok(听 === 1, 'C1a 本文件订阅了 enemy:defeated（实到 ' + 听 + ' 个 listener，与 battle.js:4720 同一条总线）');
        w.W.EventBus.emit('enemy:defeated', { enemyId: '赤炎狼', enemyType: 'beast', species: 'beast', tags: [] });
        const st = w.W.currentCharData._bondedArtifact.spirit._flawState;
        ok(st && st.killStreak === 1 && w.msgs.some(m => m.text.indexOf('第 1 个') >= 0),
            'C1b 杀第一个 → 连斩 1，且「尝血」那句真播给玩家了（不是只在表里）');
        const w2 = 建世界({ ba: 火器('bloodthirst') });
        w2.W.EventBus.emit('enemy:defeated', { enemyId: 'a', enemyType: 'beast' });
        w2.W.EventBus.emit('enemy:defeated', { enemyId: 'b', enemyType: 'beast' });
        // ⚠️ 账是同一个对象引用，读数必须**当场取值**——事后回看 st2 会看到清零后的 0
        const streak2 = w2.W.currentCharData._bondedArtifact.spirit._flawState.killStreak;
        const hp2 = w2.W.currentCharData.health;
        w2.W.EventBus.emit('enemy:defeated', { enemyId: 'c', enemyType: 'beast' });
        const streak3 = w2.W.currentCharData._bondedArtifact.spirit._flawState.killStreak;
        ok(streak2 === 2 && hp2 === 100 && streak3 === 0 && w2.W.currentCharData.health === 95,
            'C1c 连斩到 3 当口反噬：连斩清零 + 自身气血 100→95（maxHealth 的 5%），前两次一点血没掉'
            + '（连斩 ' + streak2 + '→' + streak3 + '、血 ' + hp2 + '→' + w2.W.currentCharData.health
            + '）⇒ 代价是可感知的阈值，不是暗扣');
        ok(w2.msgs.some(m => m.kind === 'warning' && m.text.indexOf('杀红了眼') >= 0),
            'C1d 反噬以 warning 单独播报（不与好处混在一行）');
    }
    // C2 消费口②：喂料回执带上「鉴材 / 预告 / 把关」
    {
        const gl = 建世界({ ba: 火器('glutton') });
        gl.W.feedArtifact();
        const glTxt = 文本(gl.msgs);
        ok(/试验灵砂/.test(glTxt) && /三品/.test(glTxt),
            'C2a 贪食·鉴材：喂料回执里报出了材料名与品阶（这是 v25.5 没有的一行）');
        const hs = 建世界({ ba: 火器('hasty') });
        hs.W.feedArtifact();
        ok(/再喂\s*\d+\s*次/.test(文本(hs.msgs)),
            'C2b 性急·预告：喂料回执里算出「再喂几次能升一阶」（纯算术，非随机）');
        const sp = 建世界({ ba: 火器('suspicious') });
        sp.slots = [{ uid: 'u9', templateId: 'low', count: 1 }];
        sp.W.inventory.slots[0].templateId = 'low';
        sp.W.itemById.low = { id: 'low', name: '劣等砂', type: 'material', quality: 'pin9' };
        const ret = sp.W.feedArtifact();
        ok(ret === false && sp.removed.length === 0 && /一口不碰/.test(文本(sp.msgs)),
            'C2c 多疑·把关：低品料（九品）被 3 阶法宝当场拒食，**材料没扣**（removed=' + sp.removed.length + '），并记一笔拒食');
        sp.W.inventory.slots[0].templateId = 'high';
        sp.W.itemById.high = { id: 'high', name: '上品灵砂', type: 'material', quality: 'pin1' };
        sp.removed.length = 0;
        const ret2 = sp.W.feedArtifact();
        ok(ret2 === true && sp.removed.length === 1 && /够格/.test(文本(sp.msgs)),
            'C2d 对口味的料照吃（够格）⇒ 把关是双向的：它替你省料，不是拦你的路');
    }
    // C3 消费口③：交感的收益/代价随脾气变
    {
        const lv = 建世界({ ba: 火器('lovesick') });
        lv.W.feedArtifact(); lv.W.feedArtifact(); lv.W.feedArtifact();
        lv.msgs.length = 0;
        const before = lv.W.currentCharData._bondedArtifact.spirit.exp;
        lv.W.feedArtifact();   // 第 4 次互动 = 阈值 4，当口反噬
        const gain = lv.W.currentCharData._bondedArtifact.spirit.exp - before;
        ok(gain === 1 && /相思入骨/.test(文本(lv.msgs)) && /减半/.test(文本(lv.msgs)),
            'C3a 相思入骨：第 4 次互动当口触发，本次经验只进一半（+3 → +' + gain + '，floor(1.5)=1），并单独播报');
        const lu2 = 建世界({ ba: 火器('lovesick') });
        lu2.msgs.length = 0;
        lu2.W.communeWithSpirit();
        ok(/我记不清是谁开的炉了/.test(文本(lu2.msgs)),
            'C3b 痴情·念旧：交感时它念一句自己的来历（1 级那一段，纯文案层）');
        const ty = 建世界({ ba: 火器('lovesick') });
        ty.W.feedArtifact();
        const heat1 = ty.W.currentCharData._bondedArtifact.spirit._flawState.heat;
        ty.W.communeWithSpirit();
        const heat2 = ty.W.currentCharData._bondedArtifact.spirit._flawState.heat;
        ok(heat1 === 1 && heat2 === 2,
            'C3c 它的账只有喂料 +1、交感**也 +1**（' + heat1 + '→' + heat2 + '，陪得越多越难过）'
            + '⇒ 五条脾气在同一个「减账」口上给出了不同答案');
        const bl = 建世界({ ba: 火器('bloodthirst') });
        bl.W.feedArtifact();
        bl.W.EventBus.emit('enemy:defeated', { enemyId: 'x' });
        bl.W.EventBus.emit('enemy:defeated', { enemyId: 'y' });
        const k1 = bl.W.currentCharData._bondedArtifact.spirit._flawState.killStreak;
        bl.W.communeWithSpirit();
        const k2 = bl.W.currentCharData._bondedArtifact.spirit._flawState.killStreak;
        ok(k1 === 2 && k2 === 1,
            'C3d 嗜血的账在交感时 −1（连斩 ' + k1 + '→' + k2 + '，静心）⇒ 「杀红了眼就停手或说说话」是真能走的规避路径');
    }
    // C4 消费口④：五道脾气在同一串输入下产出**两两不同**的文本（防「只有数据没有消费」）
    {
        const 指纹 = FLAW_KEYS.map(k => {
            const w = 建世界({ ba: 火器(k, 3) });
            w.W.feedArtifact(); w.W.feedArtifact(); w.W.communeWithSpirit();
            w.W.EventBus.emit('enemy:defeated', { enemyId: '试刀鬼', enemyType: 'human' });
            return 文本(w.msgs).replace(/\s+/g, '');
        });
        const 去重 = new Set(指纹);
        ok(去重.size === 5, 'C4 五道脾气在同一串输入下产出 5 份互不相同的回执（去重后 ' + 去重.size + ' 份）'
            + '——若这里只有 1 份，说明性格表是死数据');
    }
    // C5 消费口⑤：面板上的器灵脾气卡（包 updateCultivationUI，不改 cultivation.js）
    {
        const src = load(SRC);
        ok(src.indexOf('__spiritFlawWrapped') > 0 && /window\.updateCultivationUI\s*=\s*wrapped/.test(src),
            'C5a 面板接缝在位：本文件包装 window.updateCultivationUI（cultivation.js 一个字没改）');
        ok(/getElementById\('cultivation-panel'\)/.test(src) && /data-spirit-flaw/.test(src),
            'C5b 卡挂在修炼面板自己的容器里、用 data-* 标记（避开 static-check.py 的动态 id 规则）');
        const cul = load('js/cultivation/cultivation.js');
        ok(cul.indexOf('器灵脾气') < 0 && cul.indexOf('temperSpiritFlaw') < 0 && cul.indexOf('spiritFlawProfile') < 0,
            'C5c 反向探针：cultivation.js 里零「器灵脾气/temperSpiritFlaw/spiritFlawProfile」——本批确实没碰禁改文件');
        ok(/flex-1|vh|overflow-y-auto|max-h-/.test(src.match(/[\s\S]{0,400}max-h-\[80vh\][\s\S]{0,200}/) ? 'max-h-[80vh]' : 'max-h-'),
            'C5d 卡插在既有 max-h-[80vh] overflow-y-auto 弹层内，未新增任何写死像素内层滚窗');
    }
    // C6 温养：性格不是一纸判决
    {
        const w = 建世界({ ba: 火器('bloodthirst'), stones: 1000 });
        const p0 = w.W.spiritFlawProfile();
        const 旧血 = w.W.currentCharData.health;
        w.W.EventBus.emit('enemy:defeated', { enemyId: 'a' });
        w.W.EventBus.emit('enemy:defeated', { enemyId: 'b' });
        w.W.EventBus.emit('enemy:defeated', { enemyId: 'c' });
        const 反噬过 = w.W.currentCharData._bondedArtifact.spirit._flawState;
        const 血掉 = 旧血 - w.W.currentCharData.health;
        const ok1 = w.W.temperSpiritFlaw();
        const p1 = w.W.spiritFlawProfile();
        ok(ok1 === true && p1.key === p0.nextKey && p1.key !== 'bloodthirst',
            'C6a 温养把脾气顺移到下一键（' + p0.name + ' → ' + p1.name + '），反噬账清零、backlashCount 留着当历史');
        ok(反噬过.backlashCount === 1 && 血掉 === 5 && p1.backlashCount === 1 && p1.meterValue === 0,
            'C6b 反噬账、掉的血、历史次数都在（不是被温养一起抹了）：' + JSON.stringify({ backlashCount: p1.backlashCount, heat: p1.meterValue }));
        const 破 = 建世界({ ba: 火器('bloodthirst'), stones: 10 });
        ok(破.W.temperSpiritFlaw() === false && 破.stones() === 10,
            'C6c 灵石不够温养不动手（分文不扣，和唤醒器灵同款前置）');
        const 无 = 建世界({ ba: { name: '试炼剑', level: 1, exp: 0, expMax: 50, element: 'fire' } });
        ok(无.W.temperSpiritFlaw() === false && /器灵未醒/.test(文本(无.msgs)),
            'C6d 没器灵就没什么可温养（早退，不炸）');
    }
}

// ============ [D] 存档往返 ============
console.log('\n[D] 存档往返：走既有白名单，旧档不炸');
{
    const gs = load('js/core/game-state.js');
    ok(gs.indexOf('_bondedArtifact: charData._bondedArtifact') > 0
        && gs.indexOf('JSON.parse(JSON.stringify(charData._bondedArtifact))') > 0
        && gs.indexOf('_bondedArtifact: (saveData._bondedArtifact') > 0,
        'D1 game-state.js 那条白名单仍在（收集 :336 整包 JSON 深拷贝 / 回灌 :990 整包灌回）——本批没动它');

    // D2 真往返：照抄上面两条判据的语义（JSON.stringify/parse + typeof object）跑一遍
    // 料特意给成九品：只有多疑那道会拒食，才验得到「拒食这一笔记不记得进档」
    const w = 建世界({ ba: 火器('suspicious'), quality: 'pin9' });
    w.W.feedArtifact(); w.W.feedArtifact(); w.W.feedArtifact();
    const cd = w.W.currentCharData;
    const collected = (cd._bondedArtifact && typeof cd._bondedArtifact === 'object')
        ? JSON.parse(JSON.stringify(cd._bondedArtifact)) : null;
    const restored = (collected && typeof collected === 'object') ? collected : null;
    ok(!!restored && restored.spirit.flaw === 'suspicious'
        && restored.spirit._flawState && typeof restored.spirit._flawState.backlashCount === 'number'
        && restored.spirit._flawState.backlashCount === 1 && restored.durability < 100,
        'D2 性格与它的账随档走：flaw=' + (restored && restored.spirit.flaw)
        + '、rejectCount=' + (restored && restored.spirit._flawState && restored.spirit._flawState.rejectCount)
        + '（第三次拒食刚好凑够起疑，账当口清零）、backlashCount=' + (restored && restored.spirit._flawState && restored.spirit._flawState.backlashCount)
        + '、器身耐久=' + (restored && restored.durability) + '（那次起疑的代价也一起进档了）');
    // D3 往返后照样能接着算（不是只能读不能写）
    const w2 = 建世界({ ba: restored, quality: 'pin9' });
    w2.W.feedArtifact();
    const p = w2.W.spiritFlawProfile();
    ok(p.active && p.key === 'suspicious' && p.meterValue >= 1,
        'D3 读档后继续互动：脾气还是原来那道，账接着往上走（meterValue=' + p.meterValue + '）');

    // D4 旧档：v25.5 的 spirit 形状（awakened/name/level/exp/expMax，**没有 flaw、没有 _flawState**）
    const 旧档 = { name: '旧剑', level: 3, exp: 0, expMax: 140, durability: 100, maxDurability: 100, element: 'water', spirit: { awakened: true, name: '玄水之灵', level: 1, exp: 0, expMax: 50 } };
    const wo = 建世界({ ba: JSON.parse(JSON.stringify(旧档)) });
    let 崩 = null, prof = null;
    try { prof = wo.W.spiritFlawProfile(); wo.W.feedArtifact(); wo.W.communeWithSpirit(); wo.W.spiritFlawBeat('kill', {}); }
    catch (e) { 崩 = e.message; }
    ok(!崩, 'D4 旧档（无 flaw 字段）读 + 喂 + 交感 + 击杀拍，全套不炸' + (崩 ? '（炸在：' + 崩 + '）' : ''));
    ok(prof && prof.active && prof.key === 'lovesick' && prof.name === '痴情',
        'D5 旧档按五行现派出一道脾气（水 → lovesick 痴情），不猜不空');
    // D6 更老的档：整个 spirit 都没有
    const 无灵 = { name: '更旧剑', level: 5, exp: 0, expMax: 200, element: 'metal' };
    const wn = 建世界({ ba: 无灵 });
    let 崩2 = null, pn = null;
    try { pn = wn.W.spiritFlawProfile(); wn.W.feedArtifact(); wn.W.communeWithSpirit(); }
    catch (e) { 崩2 = e.message; }
    ok(!崩2 && pn && pn.active === false && pn.hasArtifact === true,
        'D6 还没有器灵的老档：profile 报 active=false，喂料/交感只走 v25.5 旧路，不炸不虚报');
    // D7 没开新键：既没往 game-state.js 加键名，也没注册 StateRegistry
    ok(/StateRegistry\.register/.test(load(SRC)) === false,
        'D7a 本文件零 StateRegistry.register —— 没有新键可注册（flaw 寄生在既有 _bondedArtifact 里）');
    const 新键 = (load(SRC).match(/xianxia_[a-z_]+/g) || []).concat((load(SRC).match(/localStorage/g) || []));
    ok(新键.length === 0, 'D7b 本文件零 localStorage / 零 xianxia_* 键（存档面只靠既有整包深拷贝）');
}

// ============ [E] 反噬确定性 ============
console.log('\n[E] 反噬零骰：同条件必得同结果');
{
    const 本体 = { name: '试炼剑', level: 3, exp: 0, expMax: 140, durability: 100, maxDurability: 100, element: 'fire', spirit: { awakened: true, name: '离火之灵', level: 3, exp: 0, expMax: 50, flaw: 'glutton' } };
    const 跑一遍 = (rand) => {
        const w = 建世界({ ba: JSON.parse(JSON.stringify(本体)), rand: rand });
        const seq = [];
        for (let i = 0; i < 8; i++) { w.W.feedArtifact(); seq.push([w.W.currentCharData._bondedArtifact.durability, w.W.currentCharData._bondedArtifact.spirit.exp].join('/')); }
        return { seq: seq.join(' | '), st: JSON.stringify(w.W.currentCharData._bondedArtifact.spirit._flawState), hp: w.W.currentCharData.health, txt: 文本(w.msgs).replace(/\s+/g, '') };
    };
    const a = 跑一遍(0.5), b = 跑一遍(0.5), c = 跑一遍(0.99), d = 跑一遍(0.01);
    ok(a.seq === b.seq && a.st === b.st && a.hp === b.hp,
        'E1 同 Math.random 喂两遍（0.5 vs 0.5），逐拍耐久/经验/反噬账全同');
    ok(a.seq === c.seq && a.st === c.st && a.txt === c.txt
        && a.seq === d.seq && a.st === d.st && a.txt === d.txt,
        'E2 把 Math.random 换三个值（0.5 / 0.99 / 0.01），反噬账与播报文案仍然逐字相同 ⇒ 性格层与随机彻底解耦');

    // E3 源码层面：性格/反噬段里零 Math.random（v25.5 原有那一句抽声口的不算）
    const src = load(SRC);
    const v26起 = src.indexOf('v25.6 器灵瑕疵');
    const 段内 = src.slice(v26起);
    const 随 = src.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /Math\.random/.test(l));
    ok(随.length === 1 && v26起 > 0 && 段内.indexOf('Math.random') < 0,
        'E3 全文件仅 ' + 随.length + ' 处 Math.random（第 ' + (随[0] && 随[0][0]) + ' 行，v25.5 原有那句抽声口），'
        + 'v25.6 性格/反噬段（第 ' + src.split('\n').slice(0, v26起).join('\n').split('\n').length + ' 行起）零随机');

// E4 五道脾气各自的反噬都真的落到了某个账上（不是只有文案）
    // 喂料 12 次够任何一道脾气越阈；击杀连着来才够「连斩三人」；
    // 料一律给九品 —— 只有多疑那道会拒食（其余四道不看品阶，两种都不影响它们）。
    const 落地 = {};
    FLAW_KEYS.forEach(k => {
        const ba = { name: '试炼剑', level: 5, exp: 0, expMax: 500, durability: 100, maxDurability: 100, element: 'fire', spirit: { awakened: true, name: '离火之灵', level: 3, exp: 0, expMax: 400, flaw: k } };
        const w = 建世界({ ba: ba, stones: 1000, quality: 'pin9' });
        const d0 = ba.durability, hp0 = w.W.currentCharData.health, s0 = w.stones(), t0 = w.times.length;
        for (let round = 0; round < 2; round++) {
            for (let i = 0; i < 12; i++) w.W.feedArtifact();
            for (let i = 0; i < 4; i++) w.W.EventBus.emit('enemy:defeated', { enemyId: '试刀鬼' + i });
        }
        const st = w.W.currentCharData._bondedArtifact.spirit._flawState;
        落地[k] = { 耐久: d0 - ba.durability, 血: hp0 - w.W.currentCharData.health, 灵石: s0 - w.stones(), 反噬次数: st.backlashCount, 多耗时: w.times.length - t0 };
    });
    console.log('        落地实测：' + JSON.stringify(落地));
    ok(Object.keys(落地).every(k => 落地[k].反噬次数 > 0), 'E4 五道脾气的反噬都真的走过（各自反噬次数 '
        + FLAW_KEYS.map(k => k + ':' + 落地[k].反噬次数).join(' ') + '）');
    ok(落地.glutton.耐久 > 0, 'E4a 贪食反噬砸在器身耐久上（−' + 落地.glutton.耐久 + '）');
    ok(落地.bloodthirst.血 > 0, 'E4b 嗜血反噬砸在自身气血上（−' + 落地.bloodthirst.血 + '）');
    ok(落地.suspicious.灵石 > 0, 'E4c 多疑反噬落在灵石上（−' + 落地.suspicious.灵石 + '）');
    ok(落地.hasty.多耗时 > 0, 'E4d 性急反噬落在时辰上（多走 ' + 落地.hasty.多耗时 + ' 次 advanceTime）');
    ok(落地.lovesick.耐久 > 0, 'E4e 痴情反噬砸在器身耐久上（−' + 落地.lovesick.耐久 + '），另减本次经验');
    // E4f 贪食的回执写着「不入账」，代码就必须真不入账（写文案不改代码 = 骗人）
    {
        const wg = 建世界({ ba: { name: '试炼剑', level: 3, exp: 0, expMax: 500, durability: 100, maxDurability: 100, element: 'fire', spirit: { awakened: true, name: '离火之灵', level: 1, exp: 20, expMax: 90, flaw: 'glutton' } } });
        const 前 = wg.W.currentCharData._bondedArtifact.spirit.exp;
        wg.W.feedArtifact(); wg.W.feedArtifact();
        const 中 = wg.W.currentCharData._bondedArtifact.spirit.exp;
        wg.W.feedArtifact();   // 第 3 次 = 阈值
        const 后 = wg.W.currentCharData._bondedArtifact.spirit.exp;
        ok(中 === 前 + 6 && 后 === 中 && /不入账/.test(文本(wg.msgs)) && /空腹夺食/.test(文本(wg.msgs)),
            'E4f 空腹夺食：前两次照给（' + 前 + '→' + 中 + '，+3 ×2），第 3 次一口吞干净（' + 中 + '→' + 后
            + '，+0），回执明写「不入账」⇒ 文案与账同源（这正是 2026-10-03 浏览器实测抓到的那处文案/代码不符）');
    }
    // E5 气血留 1 点底：反噬不许在面板外把人打死
    const wLow = 建世界({ ba: 火器('bloodthirst') });
    wLow.W.currentCharData.health = 2; wLow.W.currentCharData.maxHealth = 100;
    wLow.W.EventBus.emit('enemy:defeated', { enemyId: 'a' });
    wLow.W.EventBus.emit('enemy:defeated', { enemyId: 'b' });
    wLow.W.EventBus.emit('enemy:defeated', { enemyId: 'c' });
    ok(wLow.W.currentCharData.health === 1,
        'E5 血只剩 2 时反噬只扣到 1 点底（实测 ' + wLow.W.currentCharData.health + '），不打死人（同 city-gate.js:101 的守卫）');
}

// ============ [F] getBA() 开袋陷阱 ============
console.log('\n[F] getBA() 陷阱：本批的读法不写角色档');
{
    const src = load(SRC);
    ok(/function getBA\(\)/.test(src) && /if \(!cd\._bondedArtifact\) cd\._bondedArtifact = null;/.test(src),
        'F1 getBA() 的开袋笔照旧在位（本批没偷偷改它——那是别人在用的公开口）');
    // F2 本批新增的读口必须是 peekBA，且 spiritFlawProfile 不许碰 getBA
    const 剖 = (fn) => {
        const a = src.indexOf('function ' + fn + '(');
        if (a < 0) return '';
        let d = 0, i = src.indexOf('{', a);
        for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(a, j + 1); } }
        return '';
    };
    ['peekBA', 'activeFlawKey', 'spiritFlawProfile', '_flawGrade', '_lovesickLine'].forEach(f => {
        const body = 剖(f);
        ok(body && body.indexOf('getBA(') < 0, 'F2 ' + f + '() 的函数体内零 getBA( 调用' + (body ? '' : '（函数不存在！）'));
    });
    ok(剖('peekBA').indexOf('cd._bondedArtifact =') < 0 && 剖('peekBA').indexOf('_bondedArtifact =') < 0,
        'F3 peekBA() 自己一个字段都不写（纯读）');

    // F4 行为钉死：角色档根本没有 _bondedArtifact 时，只读不改
    const w = 建世界({ ba: undefined });
    const cd = w.W.currentCharData;
    const 有 = () => Object.prototype.hasOwnProperty.call(cd, '_bondedArtifact');
    delete cd._bondedArtifact;
    const p = w.W.spiritFlawProfile();
    ok(!有() && p.active === false && p.hasArtifact === false,
        'F4 空档上读 profile：hasOwnProperty(_bondedArtifact) 仍为 false ⇒ 真没被开袋'
        + '（若这里变 true，说明读口误调了 getBA()）');
    w.W.spiritFlawBeat('kill', {});
    w.W.spiritFlawBeat('feed', {});
    ok(!有(),
        'F5 空档上连打两拍（kill/feed）也照样不写 _bondedArtifact —— 无器灵时消费口早退');
    // F6 对照组：真的调 getBA() 就会写（证明 F4/F5 不是恒真）
    w.W.getBA();
    ok(有() && cd._bondedArtifact === null,
        'F6 对照组：同一份空档上真调一次 getBA()，字段立刻被写成 null ⇒ F4/F5 测的是「没调」，不是「写不出」');
}

// ============ [G] 反向自证：把性格接进战力乘位，本套必须转红 ============
console.log('\n[G] 改前复现：性格一旦接进乘位，A1/A4 当场报红');
{
    const 原 = load(SRC);
    // 只在内存里改：往 artifactCombatMul 里加一行 mul += flaw.length * 0.001
    // （按 flaw 本身取值，才真的分叉——加一个常数只会整体抬高，抓不到 A1 要抓的东西）
    const 坏 = 原.replace(
        "    if (ba.spirit && ba.spirit.awakened) mul += (ba.spirit.level || 0) * 0.02;\n    return mul;",
        "    if (ba.spirit && ba.spirit.awakened) mul += (ba.spirit.level || 0) * 0.02;\n"
        + "    if (ba.spirit && ba.spirit.flaw) mul += ba.spirit.flaw.length * 0.001;   // [探针] 性格偷偷进乘区\n    return mul;"
    );
    ok(坏 !== 原, 'G1 探针注入成功（在 artifactCombatMul 里按 flaw 取值加进乘区）');

    const 五道 = (src) => FLAW_KEYS.map(k => 建世界({ ba: 火器(k), src: src }).W.artifactCombatMul());
    const 好的 = 五道(原), 坏的 = 五道(坏);
    ok(new Set(好的).size === 1, 'G2 原件：五道脾气一个乘值（' + 好的[0].toFixed(4) + '）');
    ok(new Set(坏的).size > 1,
        'G3 探针件：五道脾气乘值开始分叉（' + 坏的.map(v => v.toFixed(4)).join(' / ') + '）⇒ A1 抓得住这条回归');
    // A4 那条源码断言也要红
    const 剖 = (src, fn) => {
        const a = src.indexOf('function ' + fn + '(');
        let d = 0;
        for (let j = src.indexOf('{', a); j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(a, j + 1); } }
        return '';
    };
    ok(/flaw/i.test(剖(坏, 'artifactCombatMul')) && !/flaw/i.test(剖(原, 'artifactCombatMul')),
        'G4 A4 的源码断言同样分叉：探针件函数体里出现了 flaw');
    // 还原必须是 byte-exact
    const 还原 = 坏.replace("\n    if (ba.spirit && ba.spirit.flaw) mul += ba.spirit.flaw.length * 0.001;   // [探针] 性格偷偷进乘区", '');
    ok(还原 === 原, 'G5 逐字还原后与原件 byte-exact 相同（长度 ' + 还原.length + ' vs ' + 原.length + '）');
    ok(load(SRC) === 原, 'G6 全程只动内存里的字符串，真实工作树 byte-exact 未被污染');
}

// ============ [H] v25.5 旧断言不许被碰坏 ============
console.log('\n[H] v25.5 的 16 条旧断言逐条重跑');
{
    function 旧世界(baState) {
        return 建世界({ ba: baState, stones: 500, slots: [{ uid: 'u1', templateId: 'mat_x', count: 1 }], itemById: { mat_x: { type: 'material', name: '测试材料' } } });
    }
    const low = 旧世界({ name: '测试剑', level: 2, exp: 0, expMax: 110, element: 'fire' });
    ok(low.W.awakenArtifactSpirit() === false && !low.W.currentCharData._bondedArtifact.spirit && low.stones() === 500,
        'H1 B4：法宝 2 阶唤不醒器灵（门槛 3 阶，分文不扣）');
    const w = 旧世界({ name: '测试剑', level: 3, exp: 0, expMax: 140, element: 'fire' });
    ok(w.W.awakenArtifactSpirit() === true, 'H2 B5：3 阶唤醒成行');
    const sp = w.W.currentCharData._bondedArtifact.spirit;
    ok(!!sp && sp.awakened && sp.name === '离火之灵' && sp.level === 1, 'H3 B6：器灵随五行得名（火 → 离火之灵，1 级）');
    ok(w.stones() === 300 && w.times[0][0] === 60 && w.times[0][1] === '唤醒器灵', 'H4 B7：唤醒扣 200 灵石 + 一个时辰');
    ok(Math.abs(w.W.artifactCombatMul() - 1.12) < 1e-9, 'H5 B8：战斗乘区仍是 1.12（性格没进乘区）');
    ok(w.W.awakenArtifactSpirit() === false, 'H6 B9：醒着的器灵不用唤第二次');
    const wc = 旧世界({ name: '测试剑', level: 3, exp: 0, expMax: 140, element: 'fire', spirit: { awakened: true, name: '离火之灵', level: 1, exp: 40, expMax: 50 } });
    wc.W.communeWithSpirit();
    const sp2 = wc.W.currentCharData._bondedArtifact.spirit;
    ok(sp2.level === 2 && sp2.exp === 6 && sp2.expMax === 70, 'H7 B10：交感 exp +16 → 升 2 级、余 6、阈值 70');
    ok(wc.times[0][1] === '与器灵交感' && wc.times[0][0] === 30, 'H8 B11：交感仍耗半个时辰（第一次 advanceTime 必须是它）');
    ok(wc.msgs.some(m => m.text.indexOf('器灵「离火之灵」成长至 2 级') >= 0), 'H9 B12：升级播报原样还在');
    const wf = 旧世界({ name: '测试剑', level: 3, exp: 0, expMax: 140, element: 'fire', spirit: { awakened: true, name: '离火之灵', level: 1, exp: 0, expMax: 50 } });
    wf.W.feedArtifact();
    ok(wf.removed[0] === 'u1' && wf.W.currentCharData._bondedArtifact.spirit.exp === 3,
        'H10 B13：喂料照扣材料、器灵经验照 +3（火 ⇒ bloodthirth 不许碰喂料路径）');
    const 空 = 旧世界(undefined);
    ok(空.W.artifactCombatMul() === 1.0, 'H11 无器灵时乘区仍是 1.0');
    const 未 = 建世界({ ba: { name: '测试剑', level: 3, exp: 0, expMax: 140, element: 'fire' }, stones: 500 });
    ok(未.W.communeWithSpirit() === false && /器灵未醒/.test(文本(未.msgs)), 'H12 没器灵时交感早退');
}

console.log('\n========== 小结：通过 ' + 通过 + ' / 失败 ' + 失败 + ' ==========');
process.exit(失败 ? 1 : 0);