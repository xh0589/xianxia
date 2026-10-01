/**
 * v25.5 玩法立项批（第一百四十七批）——玩家点单「都可以做」，六路玩法一次立项。
 *
 *   A 入魔转变线：_demonicCorruption 暗账变明路——面板露出、燃魔焰（activeBuffs 六维真进战斗）、
 *     压制魔心、每日失控判定、死字段 _demonicPower 复活入档；心魔战 _heartDemonBattle 断线接通
 *     （赢了心魔战终于走「战胜心魔」结算）；
 *   B 器灵养成：本命法宝 3 阶唤醒器灵，交感成长，等级进 _artifactMul 战斗乘区，声口随级解锁；
 *   C 主动偷窃：NPC 对话面板常驻「摸包」——身法/境界定成功率，成了得灵石（境界尺），
 *     败了恶名/好感/城市声望/罚金四本账一起赔，每人每日一次，道侣挚交下不去手；
 *   D 风水布置：静室八方位（后天八卦配五行），摆件合气吉位 +6%/小吉 +3%/煞位 -4%，
 *     总倍率进 getHouseBonus('cultivation')，煞位每日反噬气机；账挂 playerHouse.fengshui 随洞府整档走；
 *   E 拍卖竞价拉锯：挂牌价六成起拍、每轮加一成、对手按钱袋深浅跟价——捡漏/被顶/收手三条路全真账；
 *   F 悬赏抢单竞争：未接取的榜上有对手每日推进猎杀，猎完即被抢走；已接取的对手即撤（先来后到）。
 *
 * 钉法：A/C/D 功能真跑（沙箱加载真源码切片或整文件），B/E/F 整文件沙箱真跑 + 源码钉位，A 段带反向探针。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let passed = 0, failed = 0;
function ok(cond, label) {
    if (cond) passed++;
    else { failed++; console.log('[FAIL] ' + label); }
}
function load(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

console.log('\n========== v25.5 玩法立项批 ==========');

// ============ A 入魔转变线 ============
console.log('\n[A] 入魔转变线（暗账变明路 + 心魔战断线接通）');
{
    const cul = load('js/cultivation/cultivation.js');
    const app = load('js/app.js');
    const gs = load('js/core/game-state.js');
    ok(cul.indexOf('window.embraceDemonicFlame = embraceDemonicFlame') >= 0 && cul.indexOf('window.suppressDemonicHeart = suppressDemonicHeart') >= 0, 'A1 燃魔焰/压制魔心导出在位');
    ok(cul.indexOf('😈</span><span class="font-bold text-purple-400 ml-2">魔道') >= 0, 'A2 修炼面板露出「魔道」块（暗账自此可见）');
    const iHook = app.indexOf('if (window._heartDemonBattle) {');
    ok(iHook > 0 && app.indexOf('window.resolveHeartDemonSuccess(_hdId)', iHook) - iHook < 600, 'A3 心魔战结算接进战后钩子（_heartDemonBattle 自上线起零读者的断线焊死）');
    ok(gs.indexOf('_demonicPower: charData._demonicPower') >= 0 && gs.indexOf('_demonicPower: n(saveData._demonicPower, 0)') >= 0, 'A4 死字段 _demonicPower 入存档白名单（往返成对）');

    // 功能真跑：切出魔道整段
    const start = cul.indexOf('var DEMONIC_FLAME_HOURS');
    const endMark = 'window.demonicDailyTick = demonicDailyTick;';
    const end = cul.indexOf(endMark);
    ok(start > 0 && end > start, 'A5 魔道段切得出来');
    const slice = cul.slice(start, end + endMark.length);

    function runDemonicWorld(rand, opts) {
        opts = opts || {};
        const msgs = [], times = [], qds = [];
        let stones = opts.stones != null ? opts.stones : 500;
        const W = {
            console: { log: () => {}, warn: () => {}, error: () => {} },
            showMessage: (t) => msgs.push(String(t)),
            currentCharData: Object.assign({ level: 20, karma: 0, energy: 100, mood: 50, willpower: 0, _demonicCorruption: 60, _demonicPower: 0 }, opts.cd || {}),
            activeBuffs: {},
            GameScheduler: { nowMinute: () => 0 },
            timeSystem: { advanceTime: (m, label) => times.push([m, label]), onNewDaySubscribe: (fn) => { W._newDay = fn; } },
            DataManager: {
                deductSpiritStones: (n) => { if (stones < n) return false; stones -= n; return true; },
                getSpiritStones: () => stones
            },
            addQiDeviation: (n) => qds.push(n),
            updateCharacterStatus: () => {},
            Math: Object.create(Math)
        };
        W.Math.random = Array.isArray(rand) ? (() => { let i = 0; return () => (i < rand.length ? rand[i++] : rand[rand.length - 1]); })() : (() => rand);
        W.window = W;
        // applyBuff 与 sect-specialties 同口径：expiryGameMinute = now + hours*60
        W.applyBuff = (id, effects, hours) => { W.activeBuffs[id] = { effects: effects, expiryGameMinute: 0 + hours * 60, duration: hours }; };
        vm.createContext(W);
        vm.runInContext(slice, W, { filename: 'demonic-slice' });
        return { W, msgs, times, qds, stones: () => stones };
    }

    ok(runDemonicWorld(0.5).W.getDemonicTierInfo(19).tier === 0 && runDemonicWorld(0.5).W.getDemonicTierInfo(20).tier === 1 && runDemonicWorld(0.5).W.getDemonicTierInfo(50).tier === 2 && runDemonicWorld(0.5).W.getDemonicTierInfo(80).tier === 3, 'A6 分档尺：20 魔气入体 / 50 半魔之躯 / 80 一步入魔');

    const wLow = runDemonicWorld(0.5, { cd: { _demonicCorruption: 10 } });
    ok(wLow.W.embraceDemonicFlame() === false && !wLow.W.activeBuffs.demonic_flame, 'A7 入魔不足 20%：魔焰点不着、buff 不落账');

    const w = runDemonicWorld(0.5);
    ok(w.W.embraceDemonicFlame() === true, 'A8 燃动魔焰成行');
    ok(w.W.currentCharData._demonicCorruption === 50, 'A9 真烧掉 10% 入魔程度（60→50）');
    const buf = w.W.activeBuffs.demonic_flame;
    ok(!!buf && buf.expiryGameMinute === 72 * 60 && buf.effects.strength === 17 && buf.effects.constitution === 9 && buf.effects.dexterity === 6, 'A10 buff 走 activeBuffs 正门（三日到期；力道 5+档×5+魔力/4=17、体魄 9、身法 6——六维键全额进战斗）');
    ok(w.W.currentCharData._demonicPower === 10, 'A11 死字段复活：魔力账 +floor(等级×0.5)=10（随档走）');
    ok(w.W.currentCharData.karma === -5 && w.qds[0] === 8 && w.W.currentCharData.energy === 80 && w.W.currentCharData.mood === 40, 'A12 代价四连落账：业障-5、气机紊乱+8、精力-20、心境-10');
    ok(w.W.embraceDemonicFlame() === false, 'A13 魔焰正燃时不可重复点');

    const wPoor = runDemonicWorld(0.5, { stones: 50 });
    ok(wPoor.W.suppressDemonicHeart() === false && wPoor.W.currentCharData._demonicCorruption === 60, 'A14 灵石不够压不动魔心（分文不扣、入魔不动）');
    const wS = runDemonicWorld(0.5);
    ok(wS.W.suppressDemonicHeart() === true && wS.stones() === 400, 'A15 压制魔心：灵石 100 真扣（500→400）');
    ok(wS.times.length === 1 && wS.times[0][0] === 120 && wS.times[0][1] === '压制魔心', 'A16 时辰真推进（120 分钟 · 压制魔心）');
    ok(wS.W.currentCharData._demonicCorruption === 50 && wS.W.currentCharData.karma === 3 && wS.W.currentCharData.willpower === 1, 'A17 入魔 60→50、业障回善+3、意志+1');

    // 每日判定：深处魔性日涨 + 失控三选一；浅处自散
    const wTick = runDemonicWorld(0.1);   // 0.1 < 0.25 失控，roll 0.1 < 0.4 → 气机紊乱
    wTick.W._newDay();
    ok(wTick.W.currentCharData._demonicCorruption === 61 && wTick.qds[0] === 6, 'A18 入魔≥50 每日魔性+1，失控判定命中 → 魔焰焚心气机紊乱+6');
    const wTick2 = runDemonicWorld(0.9);  // 0.9 ≥ 0.25 不失控
    wTick2.W._newDay();
    ok(wTick2.W.currentCharData._demonicCorruption === 61 && wTick2.qds.length === 0, 'A19 骰不过 0.25：只涨不失控');
    const wTick3 = runDemonicWorld(0.5, { cd: { _demonicCorruption: 30 } });
    wTick3.W._newDay();
    ok(wTick3.W.currentCharData._demonicCorruption === 29, 'A20 浅层魔气自散（日-1）——危险的深度等不来好转，只有压制一条路');

    // 反向探针：拆掉面板块，魔道入口必须消失（证明入口是量出来的）
    const pStart = cul.indexOf('// v25.5 魔道：入魔程度不再是只进不出的暗账');
    const pEnd = cul.indexOf('// v20.41 丹毒');
    const culNoPanel = cul.slice(0, pStart) + cul.slice(pEnd);
    ok(pStart > 0 && pEnd > pStart && culNoPanel.indexOf('window.embraceDemonicFlame()') < 0, 'A21 反向探针：拆掉面板块后「燃动魔焰」按钮全仓消失（函数本体仍在，只是没人叫得动）');
}

// ============ B 器灵养成 ============
console.log('\n[B] 器灵养成（本命法宝文件头留的口子接上了）');
{
    const ba = load('js/equipment/bonded-artifact.js');
    const cul = load('js/cultivation/cultivation.js');
    ok(ba.indexOf('function awakenArtifactSpirit()') >= 0 && ba.indexOf('function communeWithSpirit()') >= 0, 'B1 唤醒/交感两函数在位');
    ok(cul.indexOf('唤醒器灵') >= 0 && cul.indexOf('window.communeWithSpirit()') >= 0, 'B2 修炼面板长出器灵入口（3 阶唤醒钮 / 交感钮）');
    ok(load('js/core/game-state.js').indexOf('_bondedArtifact: charData._bondedArtifact') >= 0, 'B3 器灵账挂 _bondedArtifact.spirit，随既有白名单深拷贝往返（不新开键）');

    function runArtifactWorld(rand, baState) {
        const msgs = [], times = [];
        let stones = 500;
        const removed = [];
        const W = {
            console: { log: () => {}, warn: () => {}, error: () => {} },
            showMessage: (t) => msgs.push(String(t)),
            currentCharData: { level: 30, _bondedArtifact: baState },
            timeSystem: { advanceTime: (m, label) => times.push([m, label]) },
            DataManager: { deductSpiritStones: (n) => { if (stones < n) return false; stones -= n; return true; } },
            inventory: { slots: [{ uid: 'u1', templateId: 'mat_x', count: 1 }] },
            itemById: { mat_x: { type: 'material', name: '测试材料' } },
            removeItem: (uid) => { removed.push(uid); },
            updateCharacterStatus: () => {},
            Math: Object.create(Math)
        };
        W.Math.random = () => rand;
        W.window = W;
        vm.createContext(W);
        vm.runInContext(ba, W, { filename: 'bonded-artifact.js' });
        return { W, msgs, times, removed, stones: () => stones };
    }

    const wLow = runArtifactWorld(0.5, { name: '测试剑', level: 2, exp: 0, expMax: 110, element: 'fire' });
    ok(wLow.W.awakenArtifactSpirit() === false && !wLow.W.currentCharData._bondedArtifact.spirit && wLow.stones() === 500, 'B4 法宝 2 阶唤不醒器灵（门槛 3 阶，分文不扣）');

    const w = runArtifactWorld(0.5, { name: '测试剑', level: 3, exp: 0, expMax: 140, element: 'fire' });
    ok(w.W.awakenArtifactSpirit() === true, 'B5 3 阶唤醒成行');
    const sp = w.W.currentCharData._bondedArtifact.spirit;
    ok(!!sp && sp.awakened && sp.name === '离火之灵' && sp.level === 1, 'B6 器灵随法宝五行得名（火 → 离火之灵，1 级）');
    ok(w.stones() === 300 && w.times[0][0] === 60 && w.times[0][1] === '唤醒器灵', 'B7 代价前置真扣：灵石 200 + 一个时辰');
    ok(Math.abs(w.W.artifactCombatMul() - 1.12) < 1e-9, 'B8 战斗乘区同管道：3 阶本体 1.10 + 器灵 1 级 ×2% = 1.12（进 battle.js _artifactMul）');
    ok(w.W.awakenArtifactSpirit() === false, 'B9 醒着的器灵不用唤第二次');

    const wC = runArtifactWorld(0.5, { name: '测试剑', level: 3, exp: 0, expMax: 140, element: 'fire', spirit: { awakened: true, name: '离火之灵', level: 1, exp: 40, expMax: 50 } });
    wC.W.communeWithSpirit();
    const sp2 = wC.W.currentCharData._bondedArtifact.spirit;
    ok(sp2.level === 2 && sp2.exp === 6 && sp2.expMax === 70, 'B10 交感：经验 +10+阶×2=16 → 40+16=56 越阈升级，余 6 带进新阈值（2 级 50→70）');
    ok(wC.times[0][1] === '与器灵交感' && wC.times[0][0] === 30, 'B11 交感耗时半个时辰（回执时长与账同源）');
    ok(wC.msgs.some(m => m.indexOf('器灵「离火之灵」成长至 2 级') >= 0), 'B12 升级如实播报（含新加成数）');

    const wF = runArtifactWorld(0.5, { name: '测试剑', level: 3, exp: 0, expMax: 140, element: 'fire', spirit: { awakened: true, name: '离火之灵', level: 1, exp: 0, expMax: 50 } });
    wF.W.feedArtifact();
    ok(wF.removed[0] === 'u1' && wF.W.currentCharData._bondedArtifact.spirit.exp === 3, 'B13 喂材料器灵同沾（经验+3）');
}

// ============ C 主动偷窃（摸包） ============
console.log('\n[C] 主动偷窃（NPC 对话面板常驻「摸包」）');
{
    const npcSrc = load('js/npcs/npc-system.js');
    ok(npcSrc.indexOf('function executePickpocket(npcId)') >= 0 && npcSrc.indexOf('window.executePickpocket = executePickpocket') >= 0, 'C1 摸包函数在位且导出');
    ok(npcSrc.indexOf('🤫 摸包') >= 0 && npcSrc.indexOf("window.executePickpocket('${npcId}')") >= 0, 'C2 对话面板常驻摸包按钮（死者不画）');

    const start = npcSrc.indexOf('var _pickpocketLog = {};');
    const endMark = 'window.executePickpocket = executePickpocket;';
    const slice = npcSrc.slice(start, npcSrc.indexOf(endMark) + endMark.length);
    ok(start > 0 && slice.length > 500, 'C3 摸包段切得出来');

    function runStealWorld(rand, opts) {
        opts = opts || {};
        const msgs = [], times = [], reps = [];
        let stones = opts.stones != null ? opts.stones : 100;
        const npc = Object.assign({
            id: 'npc_test', name: '测试路人', isDead: false,
            relationship: { affection: 10 },
            hasFlag: () => false,
            recordPlayerAction: () => {},
            changeHatred: () => {}
        }, opts.npc || {});
        const W = {
            console: { log: () => {}, warn: () => {}, error: () => {} },
            showMessage: (t) => msgs.push(String(t)),
            clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
            currentCharData: Object.assign({ dexterity: 20, realm: '金丹', karma: 0, notoriety: 0, location: '测试城' }, opts.cd || {}),
            npcManager: { getNPC: (id) => (id === 'npc_test' ? npc : null) },
            timeSystem: { advanceTime: (m, label) => times.push([m, label]), getAbsoluteDay: () => 5 },
            getRealmTier: () => 3,
            bountyRealmMul: () => 2,
            DataManager: {
                addSpiritStones: (n) => { stones += n; },
                deductSpiritStones: (n) => { if (stones < n) return false; stones -= n; return true; }
            },
            getCurrentCityName: () => '测试城',
            reduceReputation: (city, n) => reps.push([city, n]),
            updateCurrencyUI: () => {},
            Math: Object.create(Math)
        };
        W.Math.random = () => rand;
        W.window = W;
        vm.createContext(W);
        vm.runInContext(slice, W, { filename: 'pickpocket-slice' });
        return { W, msgs, times, reps, npc, stones: () => stones };
    }

    // 成功率 = clamp(0.30 + (20-10)*0.01 + 3*0.02) = 0.46
    const wDao = runStealWorld(0.1, { npc: { hasFlag: (f) => f === 'dao_companion' } });
    ok(wDao.W.executePickpocket('npc_test') === false && wDao.times.length === 0 && wDao.stones() === 100, 'C4 道侣下不去手（不耗时、不动账）');
    const wFriend = runStealWorld(0.1, { npc: { relationship: { affection: 85 } } });
    ok(wFriend.W.executePickpocket('npc_test') === false, 'C5 好感 ≥80 的挚交也下不去手');

    const w = runStealWorld(0.1);   // 0.1 < 0.46 得手；赃款 (8+floor(0.1*12))*2 = 18
    ok(w.W.executePickpocket('npc_test') === true, 'C6 得手路径成行');
    ok(w.stones() === 118, 'C7 赃款走灵石真源：(8+1)×境界尺2 = 18 入袋（100→118）');
    ok(w.W.currentCharData.karma === -2 && w.W.currentCharData.notoriety === 1 && w.npc.relationship.affection === 0, 'C8 得手也有价：业障+2、恶名+1、好感-10');
    ok(w.times.length === 1 && w.times[0][0] === 10 && w.times[0][1] === '摸包', 'C9 摸包耗时一刻（10 分钟真推进）');
    ok(w.W.executePickpocket('npc_test') === false && w.times.length === 1, 'C10 每人每日一次：同日再摸被拦（不耗时）');

    const wMiss = runStealWorld(0.6);   // 0.46 ≤ 0.6 < 0.91 失手
    ok(wMiss.W.executePickpocket('npc_test') === false && wMiss.stones() === 100 && wMiss.npc.relationship.affection === -5, 'C11 失手但没被抓：分文未得、好感-15');
    ok(wMiss.W.currentCharData.notoriety === 0, 'C12 没抓着把柄不加恶名（罚账分明）');

    const wCaught = runStealWorld(0.99);   // ≥0.91 人赃并获
    ok(wCaught.W.executePickpocket('npc_test') === false, 'C13 人赃并获路径成行');
    ok(wCaught.W.currentCharData.notoriety === 5 && wCaught.W.currentCharData.karma === -3, 'C14 并获：恶名+5、业障+3');
    ok(wCaught.reps.length === 1 && wCaught.reps[0][0] === '测试城' && wCaught.reps[0][1] === 30, 'C15 城市声望-30 走 reduceReputation 正门（报的是真城名）');
    ok(wCaught.stones() === 70, 'C16 罚金 30 真扣（100→70）');
    ok(wCaught.msgs.some(m => m.indexOf('人赃并获') >= 0), 'C17 回执如实（不粉饰）');

    const wBroke = runStealWorld(0.99, { stones: 10 });
    wBroke.W.executePickpocket('npc_test');
    ok(wBroke.stones() === 10 && wBroke.W.currentCharData.notoriety === 8, 'C18 拿不出罚金罪加一等：分文不扣、恶名 5+3=8（不吞钱也不免罚）');
}

// ============ D 风水布置 ============
console.log('\n[D] 风水布置（静室八方位，吉煞真进修炼倍率）');
{
    const fsSrc = load('js/extensions/fengshui.js');
    ok(load('js/house-system.js').indexOf('result *= (Number(window.getFengshuiMul()) || 1);') >= 0, 'D1 消费点焊死：getHouseBonus(cultivation) 末段乘风水倍率');
    ok(load('js/house-panel.js').indexOf('window.openFengshuiUI()') >= 0 && load('js/house-panel.js').indexOf('风水布置') >= 0, 'D2 洞府面板有入口（库房家具区）+ 明细签');
    ok(load('仙侠.html').indexOf('<script defer src="js/extensions/fengshui.js"></script>') >= 0, 'D3 脚本装载在位（cave-life 之后）');

    function runFsWorld(rand, house, opts) {
        opts = opts || {};
        const msgs = [], saves = [], qds = [];
        let stones = opts.stones != null ? opts.stones : 2000;
        const W = {
            console: { log: () => {}, warn: () => {}, error: () => {} },
            showMessage: (t) => msgs.push(String(t)),
            playerHouse: house,
            HOUSE_FURNITURE: { mat: { name: '聚灵蒲团', icon: '🧘' }, stove: { name: '暖玉炉', icon: '🔥' }, lamp: { name: '聚灵灯', icon: '🏮' } },
            DataManager: { deductSpiritStones: (n) => { if (stones < n) return false; stones -= n; return true; } },
            saveHouseData: () => saves.push(JSON.parse(JSON.stringify(W.playerHouse))),
            addQiDeviation: (n) => qds.push(n),
            timeSystem: { onNewDaySubscribe: (fn) => { W._newDay = fn; } },
            Math: Object.create(Math)
        };
        W.Math.random = () => rand;
        W.window = W;
        vm.createContext(W);
        vm.runInContext(fsSrc, W, { filename: 'fengshui.js' });
        return { W, msgs, saves, qds, stones: () => stones };
    }
    const mkHouse = () => ({ type: 'cave', furniture: ['mat'] });

    const wj = runFsWorld(0.5, mkHouse());
    ok(wj.W.judgeFengshuiPlacement('zhen', 'fs_qinglong').verdict === '吉' && wj.W.judgeFengshuiPlacement('zhen', 'fs_qinglong').pct === 6, 'D4 同气吉位：木器居震位（东·木）+6%');
    ok(wj.W.judgeFengshuiPlacement('kan', 'fs_qinglong').verdict === '小吉' && wj.W.judgeFengshuiPlacement('kan', 'fs_qinglong').pct === 3, 'D5 位生物器小吉：水生木，坎位安青龙案 +3%');
    ok(wj.W.judgeFengshuiPlacement('li', 'fs_qinglong').verdict === '泄' && wj.W.judgeFengshuiPlacement('li', 'fs_qinglong').pct === 0, 'D6 器物生位为泄：木生火，无得无损');
    ok(wj.W.judgeFengshuiPlacement('kun', 'fs_qinglong').verdict === '煞' && wj.W.judgeFengshuiPlacement('kun', 'fs_qinglong').pct === -4, 'D7 相冲煞位：木克土，坤位安青龙案 -4%');

    ok(wj.W.placeFengshui('zhen', 'fs_qinglong') === false, 'D8 没置办过的法器安不上（先买后摆）');
    ok(wj.W.buyFengshuiItem('fs_qinglong') === true && wj.stones() === 1500, 'D9 置办法器：灵石 500 真扣（2000→1500）');
    ok(wj.saves.length >= 1 && wj.saves[wj.saves.length - 1].fengshui.owned.indexOf('fs_qinglong') >= 0, 'D10 置办即随洞府整档落盘（不新开存储键——v25.3 铁律）');
    ok(wj.W.placeFengshui('zhen', 'fs_qinglong') === true && wj.W.playerHouse.fengshui.placements.zhen === 'fs_qinglong', 'D11 安上吉位，账落在 playerHouse.fengshui');
    ok(wj.W.placeFengshui('xun', 'fs_qinglong') === true && !wj.W.playerHouse.fengshui.placements.zhen && wj.W.playerHouse.fengshui.placements.xun === 'fs_qinglong', 'D12 一件法器只安一位：挪位自动从旧位收起');
    ok(wj.W.placeFengshui('zhen', 'mat') === true, 'D13 已摆进屋的家具也能当摆件（聚灵蒲团·木）');
    ok(Math.abs(wj.W.getFengshuiMul() - 1.12) < 1e-9, 'D14 总倍率 = 1 + (巽位青龙案·吉6 + 震位蒲团·吉6)/100 = 1.12（两吉位合账）');

    const wRuin = runFsWorld(0.5, { type: 'ruin', furniture: [] });
    ok(wRuin.W.getFengshuiMul() === 1 && wRuin.W.buyFengshuiItem('fs_qinglong') === false, 'D15 破山洞立不住方位：倍率如实回 1、铺子不卖');
    const wNoHouse = runFsWorld(0.5, null);
    ok(wNoHouse.W.getFengshuiMul() === 1, 'D16 没宅如实回 1（消费端永远拿得到数）');

    // 煞位反噬：随机 0.1 < 0.15 → 触发
    const wSha = runFsWorld(0.1, mkHouse());
    wSha.W.buyFengshuiItem('fs_qinglong');
    wSha.W.placeFengshui('kun', 'fs_qinglong');   // 木克土煞位
    wSha.W._newDay();
    ok(wSha.qds[0] === 3 && wSha.msgs.some(m => m.indexOf('煞位 1 处') >= 0), 'D17 煞位每日反噬：骰中 → 气机紊乱+3，回执点名煞位数');
    const wSha2 = runFsWorld(0.9, mkHouse());
    wSha2.W.buyFengshuiItem('fs_qinglong');
    wSha2.W.placeFengshui('kun', 'fs_qinglong');
    wSha2.W._newDay();
    ok(wSha2.qds.length === 0, 'D18 骰不中不反噬（15% 是几率不是必然）');
    const wJi = runFsWorld(0.1, mkHouse());
    wJi.W.buyFengshuiItem('fs_qinglong');
    wJi.W.placeFengshui('zhen', 'fs_qinglong');   // 吉位
    wJi.W._newDay();
    ok(wJi.qds.length === 0, 'D19 吉位无反噬（只罚煞不罚吉）');
}

// ============ E 拍卖竞价拉锯 ============
console.log('\n[E] 拍卖竞价拉锯（拍卖行里终于有拍卖了）');
{
    const as = load('js/economy/auction-service.js');
    ok(as.indexOf('function startBidWar(id)') >= 0 && as.indexOf('startBidWar: startBidWar') >= 0, 'E1 竞价拉锯在位且进 api');
    ok(as.indexOf('⚔️ 竞价') >= 0 && as.indexOf('一口价') >= 0, 'E2 面板双钮：竞价拉锯 / 一口价买断（buyNpcLot 原样保留）');
    ok(as.indexOf('function buyNpcLot(id)') >= 0, 'E3 一口价正门未被改动');

    function runAuctionWorld(rands, stones0) {
        const msgs = [], times = [], debits = [], snapshots = [];
        let stones = stones0 != null ? stones0 : 1000;
        let ri = 0;
        const W = {
            console: { log: () => {}, warn: () => {}, error: () => {} },
            showMessage: (t) => msgs.push(String(t)),
            gameLog: { add: () => {} },
            currentCharData: { name: '测试修士' },
            inventory: { currency: { get spiritStones() { return stones; }, set spiritStones(v) { stones = v; } }, slots: [] },
            EconomyTransaction: {
                run: (fn) => fn(),
                debit: (k, n) => { if (k === 'spiritStones') { if (stones < n) return false; stones -= n; debits.push(n); return true; } return false; },
                addSnapshot: (snap) => { snapshots.push(snap); return true; }
            },
            itemById: { test_item: { id: 'test_item', name: '测试丹', price: 100 } },
            timeSystem: { gameTime: { totalMinutes: 0, currentDay: 1 }, advanceTime: (m, label) => times.push([m, label]) },
            GameScheduler: { nowMinute: () => 0, registerHandler: () => {}, schedule: () => {}, cancel: () => {} },
            document: {
                createElement: () => ({ style: {}, innerHTML: '', id: '', className: '', onclick: null, remove: () => {} }),
                body: { appendChild: () => {}, insertAdjacentHTML: () => {} },
                getElementById: () => null
            },
            Math: Object.create(Math)
        };
        W.Math.random = () => (ri < rands.length ? rands[ri++] : rands[rands.length - 1]);
        W.window = W;
        vm.createContext(W);
        vm.runInContext(as, W, { filename: 'auction-service.js' });
        // 直接注入一件 NPC 拍品（挂牌 100 灵石）
        W.AuctionService.deserialize({
            items: [{ id: 'npc_auc_t1', sellerType: 'npc', sellerName: '测试卖家', itemName: '测试丹', templateId: 'test_item', quantity: 1, itemSnapshot: { templateId: 'test_item', count: 1 }, unitPrice: 100, listedMinute: 0, dueMinute: 1440, status: 'active' }],
            npcRefreshDay: 1, counter: 1, notices: [], royalRefreshDay: -1, royalItems: []
        });
        return { W, msgs, times, debits, snapshots, stones: () => stones };
    }

    // 竞得：起拍 60，对手钱袋 105（rands[1]=0.5 → 0.7+0.35），加到 70 对手收手（rand 0.9 ≥ 0.8）
    const w = runAuctionWorld([0.0, 0.5, 0.9], 1000);
    ok(w.W.AuctionService.startBidWar('npc_auc_t1') === true, 'E4 竞价开局成行');
    let war = w.W.AuctionService.getBidWar();
    ok(war && war.price === 60 && war.step === 10 && war.round === 0, 'E5 起拍=挂牌六成 60、每轮加一成 10');
    ok(w.times.some(t => t[0] === 10 && t[1] === '竞价'), 'E6 看场耗时一刻（10 分钟真推进）');
    const won = w.W.AuctionService.bidWarRaise();
    ok(won === true, 'E7 对手收手 → 竞得');
    ok(w.debits[0] === 70 && w.snapshots.length === 1, 'E8 原子事务真扣 70 灵石、货真入包（比挂牌价省 30——捡漏是真的）');
    ok(w.W.AuctionService.getState().items[0].status === 'sold' && w.msgs.some(m => m.indexOf('落槌') >= 0 && m.indexOf('省 30') >= 0), 'E9 拍品落槌易主，回执念真账（省了多少、几轮）');

    // 被顶掉：对手钱袋深（budget=140），一路跟到第 8 轮封顶
    const w2 = runAuctionWorld([0.0, 1.0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], 5000);
    w2.W.AuctionService.startBidWar('npc_auc_t1');
    for (let i = 0; i < 8; i++) w2.W.AuctionService.bidWarRaise();
    const lot2 = w2.W.AuctionService.getState().items[0];
    ok(lot2.status === 'sold' && lot2.buyerName === '锦衣豪商', 'E10 轮数封顶对手死不松口 → 拍品当场归对手（被顶掉是真的）');
    ok(w2.debits.length === 0 && w2.stones() === 5000, 'E11 被顶掉分文不扣（没成交就没账）');

    // 收手：拍品还在
    const w3 = runAuctionWorld([0.0, 0.5], 1000);
    w3.W.AuctionService.startBidWar('npc_auc_t1');
    ok(w3.W.AuctionService.bidWarFold() === false && w3.W.AuctionService.getState().items[0].status === 'active', 'E12 收手：拍品仍挂在架上（下次开市再来）');
    ok(w3.debits.length === 0, 'E13 收手不扣钱');

    // 钱袋盖不过下一口价：只能收手
    const w4 = runAuctionWorld([0.0, 0.5], 65);
    w4.W.AuctionService.startBidWar('npc_auc_t1');
    w4.W.AuctionService.bidWarRaise();
    ok(w4.W.AuctionService.getBidWar() === null && w4.W.AuctionService.getState().items[0].status === 'active' && w4.stones() === 65, 'E14 钱袋 65 盖不过 70：如实告知只能收手，分文不扣');
}

// ============ F 悬赏抢单竞争 ============
console.log('\n[F] 悬赏抢单竞争（手慢无是真的）');
{
    const bb = load('js/quest/bounty-board.js');
    ok(bb.indexOf('RIVAL_NAMES') >= 0 && bb.indexOf('snatched') >= 0, 'F1 竞争对手名册与被抢标记在位');
    ok(bb.indexOf('也在猎这单') >= 0, 'F2 榜单亮出对手脚程（看着它一天天逼近）');

    function runBountyWorld(rand, src) {
        const logs = [], msgs = [];
        const W = {
            console: { log: () => {}, warn: () => {}, error: () => {} },
            showMessage: (t) => msgs.push(String(t)),
            gameLog: { add: (m) => logs.push(String(m)) },
            currentCharData: { realm: '炼气', fame: 0 },
            getRealmTier: () => 0,
            timeSystem: { getAbsoluteDay: () => 5, onNewDaySubscribe: (fn) => { W._newDay = fn; } },
            EventBus: { on: () => {} },
            document: { getElementById: () => null, body: { insertAdjacentHTML: () => {} } },
            Math: Object.create(Math)
        };
        if (typeof rand === 'number') W.Math.random = () => rand;
        W.window = W;
        vm.createContext(W);
        vm.runInContext(src || bb, W, { filename: 'bounty-board.js' });
        return { W, logs, msgs };
    }

    const w = runBountyWorld();
    const board = w.W.getBountyBoard();
    ok(board.length === 3, 'F3 开榜三条');
    const tpls = board.map(b => b.tplId);
    ok(new Set(tpls).size === 3, 'F4 三条不同模板（' + tpls.join(',') + '）');
    ok(board.every(b => b.rival && b.rival.rate >= 0.25 && b.rival.rate <= 0.7 && b.snatched === false && b.rivalProgress === 0), 'F5 每条都挂着脚程 25%~70%/日的对手');
    ok(board.every(b => ['铁面客', '独臂刀娘', '赏金猎户', '青衣剑奴', '夜枭', '独行客'].indexOf(b.rival.name) >= 0), 'F6 对手名册内取号');

    ok(w.W.acceptBounty(0) === true, 'F7 接取照旧成行');
    board[1].rival.rate = 1.0;   // 快刀客：一天猎完
    board[1].snatched = true;
    ok(w.W.acceptBounty(1) === false && w.msgs.some(m => m.indexOf('手慢无') >= 0), 'F8 被抢的单接不了（如实告知被谁抢了先）');
    board[1].snatched = false;
    w.W._newDay();   // 每日推进：1 号 rate=1.0 → rivalProgress≥count → 被抢
    const board2 = w.W.getBountyBoard();
    ok(board2.length === 3 && !board2.some(b => b.id === board[1].id), 'F9 对手猎完即抢走：被抢单摘榜、空位补新单（榜面始终三条）');
    ok(w.logs.some(m => m.indexOf('抢先猎完') >= 0 && m.indexOf(board[1].rival.name) >= 0), 'F10 抢单落日志（点名是谁抢的）');
    ok(board2.some(b => b.accepted && b.id === board[0].id), 'F11 已接取的照旧保留——接了对手就撤（先来后到）');
    const accepted = board2.find(b => b.accepted);
    const rpBefore = accepted.rivalProgress || 0;
    w.W._newDay();
    ok((accepted.rivalProgress || 0) === rpBefore, 'F12 已接取的单对手不再推进（无时限压力，与旧账兼容）');

    // 反向探针：拆掉抢单推进句，快刀客跑一天也抢不走单
    const bbNoSnatch = bb.replace('b.rivalProgress = (b.rivalProgress || 0) + Math.max(1, Math.ceil(b.rival.rate * b.count));', '');
    ok(bbNoSnatch !== bb, 'F13a 探针备料：推进句拆得掉');
    const w2 = runBountyWorld(null, bbNoSnatch);
    const board3 = w2.W.getBountyBoard();
    board3[0].rival.rate = 1.0;
    w2.W._newDay();
    ok(w2.W.getBountyBoard().some(b => b.id === board3[0].id) && !board3[0].snatched, 'F13 反向探针：拆掉推进句后快刀客原地空转，单子好好挂在榜上');
}

console.log('\n通过：' + passed + '　失败：' + failed);
process.exitCode = failed ? 1 : 0;
