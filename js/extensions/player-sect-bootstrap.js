// ==================== player-sect-bootstrap.js - 白手起家（立宗改造 · 从开局就能竖幡） ====================
// 此前自建宗门有两笔烂账：① 元婴修为 + 六百灵石山门才许立宗——可现实逻辑里，立派的成本是「敢竖幡」，
//    不是修为；没建筑没名望，立的只是个空壳，没人会主动来投，这才是真实的世界。
// ② 数据不平：零弟子零工坊却日产灵石丹药兵器（凭空生产），立派当日白拿贺礼（凭空来钱），
//    招徒只认好感二十的旧识（新宗死路）——全违反这个世界「资源守恒、有名有姓」的铁律。
// 本模块把立宗拆成两条路：
//   插旗草创：任何境界，三十灵石（幡布、香烛、官府登记），无建筑、库房空空、分文不产、没人主动来；
//   开山立宗：旧路照走（元婴 + 购地），草创挣下家底后也可补择山门升格。
// 建筑三级定产出：草创（零）→ 赁屋（每日灵石一，门客帮工半枚）→ 山门（原产出口径，丹药兵器要有人做）。
// 主动招徒走「游说」：晓之以理 / 亮实底 / 许好处 / 吹牛撒谎四种话术——
//   吹牛成功率高，但记「虚名债」：规模兑不上，月月有概率穿帮（声望跌、被骗来的弟子连夜走、街谈传笑柄）；
//   规模追上了，虚名做实，反涨声望。撒谎是梯子，也是雷。
// 门客（客卿）：月俸五灵石真扣宗库，帮工有产出，欠俸即散。弟子月俸二灵石，发不出就走人。
// 名望决定投奔：有名才有人主动来（月度按门面与名声判定）。
// 自建宗门同步入户部账（sectsData + SECT_INTERNAL）：座次从「残破」爬起，立场按出身定底色，
//   外界劫掠落到户部账的亏空，会真转嫁回宗库（守恒）。
// 纪律：零外文字母，文案不带计数器口吻；每一笔钱有来路有去向。
(function () {
    'use strict';
    var W = window;
    if (typeof W === 'undefined') return;

    var BANNER_COST = 30;   // 插旗草创：一面幡、三炷香、一纸官府登记
    var HOUSE_COST = 200;   // 赁屋：城里租一进院子
    var GUEST_SALARY = 5;   // 门客月俸
    var DISC_SALARY = 2;    // 弟子月俸
    var DRIVE_PAY = 30;     // 许好处的见面礼
    var DRIVE_DAY_CAP = 5;  // 一日之内，嘴皮子也有极限

    function P() { return W.PlayerSect; }
    function mine() { try { return (P() && P().listMySects && P().listMySects()[0]) || null; } catch (e) { return null; } }
    // 第九波·总账根治：WorldCalendar.day / timeSystem.totalDays 在生产里根本不存在，旧钟恒 0——
    // 月结（俸银/投奔/穿帮/对账）全死，游说日限还永不重置（累计五次后招徒永久锁死）。
    // 统一优先真钟 getAbsoluteDay；旧字段只作测试沙箱的退路。
    function today() {
        try {
            if (typeof W.getAbsoluteDay === 'function') { var g = W.getAbsoluteDay(); if (g) return Math.floor(g); }
            var t = W.timeSystem;
            if (t) {
                if (typeof t.getAbsoluteDay === 'function') { var g2 = t.getAbsoluteDay(); if (g2) return Math.floor(g2); }
                if (t.gameTime && t.gameTime.currentDay) return Math.floor(t.gameTime.currentDay);
                if (t.totalDays) return Math.floor(t.totalDays);
            }
            if (W.WorldCalendar && W.WorldCalendar.day) return Math.floor(W.WorldCalendar.day);
        } catch (e) {}
        return 0;
    }
    function absDay() { return today(); }
    function msg(t, ty) { try { if (W.showMessage) W.showMessage(t, ty || 'info'); } catch (e) {} }
    function log(m, t) { try { if (W.gameLog && W.gameLog.add) W.gameLog.add(m); } catch (e) {} }
    function modal(t, b) { try { if (W.showModal) W.showModal(t, b); } catch (e) {} }
    function flags() { return (W.eventFlags = W.eventFlags || {}); }
    function stones() {
        try {
            if (W.DataManager && typeof W.DataManager.getSpiritStones === 'function') return W.DataManager.getSpiritStones();
            if (W.XianXia && W.XianXia.DataManager && typeof W.XianXia.DataManager.getSpiritStones === 'function') return W.XianXia.DataManager.getSpiritStones();
        } catch (e) {}
        return (W.currentCharData && W.currentCharData.spiritStones) || 0;
    }
    function deductStones(n) {
        try {
            if (W.DataManager && typeof W.DataManager.deductSpiritStones === 'function') return W.DataManager.deductSpiritStones(n);
            if (W.XianXia && W.XianXia.DataManager && typeof W.XianXia.DataManager.deductSpiritStones === 'function') return W.XianXia.DataManager.deductSpiritStones(n);
        } catch (e) {}
        var cd = W.currentCharData;
        if (cd && (cd.spiritStones || 0) >= n) { cd.spiritStones -= n; return true; }
        return false;
    }
    function street(text) {
        try {
            var f = flags();
            if (!f['qi_street'] || !f['qi_street'].push) f['qi_street'] = [];
            f['qi_street'].push({ day: absDay(), text: String(text) });
            if (f['qi_street'].length > 60) f['qi_street'].splice(0, f['qi_street'].length - 60);
        } catch (e) {}
    }
    function chron(sect, text) {
        try { if (W.SectGov && W.SectGov.chronicle) { W.SectGov.chronicle(sect, text); return; } } catch (e) {}
        var it = (W.SECT_INTERNAL || {})[sect];
        if (!it) return;
        if (!it.chronicle) it.chronicle = [];
        it.chronicle.push({ day: absDay(), text: String(text) });
        if (it.chronicle.length > 40) it.chronicle.splice(0, it.chronicle.length - 40);
    }
    function city() { try { return (W.locationSystem && W.locationSystem.getCurrentLocation && W.locationSystem.getCurrentLocation()) || ''; } catch (e) { return ''; } }
    function tierOfRealm(r) { try { return typeof W.getRealmTier === 'function' ? (W.getRealmTier(r) || 0) : 0; } catch (e) { return 0; } }
    function playerFame() { try { return Number((W.currentCharData && W.currentCharData.fame) || 0); } catch (e) { return 0; } }
    function npcName(npcId) {
        try {
            var n = W.npcManager && W.npcManager.getNPC ? W.npcManager.getNPC(npcId) : null;
            return (n && n.name) ? n.name : '一名修士';
        } catch (e) { return '一名修士'; }
    }

    var CITY2REGION = {
        '洛水城': '中州', '帝都·长安': '中州', '青木城': '东荒', '炎城': '东南海域',
        '冰原城': '北冥', '万毒谷': '南疆', '大漠孤城': '西漠', '剑阁': '蜀地'
    };

    // ============ 一 · 建筑三级（家底是挣出来的，不是生出来的） ============
    // stage: 0 草创（插旗，无片瓦）/ 1 赁屋（城里租院）/ 2 山门（购地开山）
    function stageOf(sect) {
        if (!sect) return 0;
        if (sect.stage != null) return sect.stage;
        return sect.terrain ? 2 : 1; // 旧档宽待：没择址的老宗门按赁屋算
    }
    var STAGE_NAME = ['草创（一人一幡）', '赁屋（城里一进院）', '山门（自有基业）'];

    // ============ 二 · 名声（决定有没有人主动来） ============
    function sectFame(sect) {
        if (!sect) return 0;
        var rep = Number((sect.resources && sect.resources.reputation) || 0);
        var workers = (sect.disciples || []).length + (sect.guests || []).length;
        return Math.round(rep * 2 + playerFame() * 0.5 + stageOf(sect) * 10 + workers * 2);
    }

    // ============ 三 · 插旗草创（开局就能立派） ============
    function foundCheap(name, alignment) {
        name = String(name || '').trim();
        if (name.length < 2) return { ok: false, reason: 'no-name' };
        if (mine()) return { ok: false, reason: 'has-sect' };
        try {
            var d = W.discipleState;
            if (d && d.isInSect) return { ok: false, reason: 'in-other-sect' };
        } catch (e) {}
        if ((W.sectsData || {})[name]) return { ok: false, reason: 'name-taken' };
        if (!deductStones(BANNER_COST)) return { ok: false, reason: 'no-stones' };
        var loc = city() || '无名之地';
        var r = P().create({ name: name, alignment: alignment || '中立', location: loc, terrain: null });
        if (!r || !r.ok) return { ok: false, reason: 'create-failed' };
        var sect = r.instance;
        sect.stage = 0;
        sect.resources.spiritStones = 0; // 白手起家：库房是空的
        sect.resources.reputation = 0;   // 名声也是空的——要自己挣
        sect.guests = [];
        // 第九波：立宗事件先跑了一步，户部镜像记下了核心默认的虚库房一百——
        // 清零之后把镜像与对账基线重新对齐真账，否则两本账从第一天就差一百
        try {
            var it0 = (W.SECT_INTERNAL || {})[name];
            if (it0) it0.resources = 0;
        } catch (e) {}
        sect._lastMirror = null;
        P().addHistory(sect.id, '插旗于' + loc + '：一面幡、三炷香、一纸官府登记，家底三十灵石花得干干净净。');
        registerInWorld(sect);
        return { ok: true, sectId: sect.id, sect: sect };
    }
    // 草创当日：没人来贺是常态——名望决定有没有人多看一眼
    function cheapFoundingDay(sect) {
        var rows = [];
        var fame = playerFame();
        if (fame >= 60) {
            sect.resources.spiritStones += 10;
            P().addHistory(sect.id, '立幡当日有旧识遣人送来薄礼，折灵石十枚。');
            rows.push('你在江湖上还算有些脸面——一位旧识遣人送来薄礼，没露面。<span class="text-yellow-400">（宗库灵石 +10）</span>');
        } else if (fame >= 20) {
            sect.resources.reputation += 1;
            P().addHistory(sect.id, '立幡当日邻里围观，有位婆婆送了一篮炊饼。');
            rows.push('邻里围过来看热闹，有位婆婆送了一篮炊饼：「开店是好事。」<span class="text-green-400">（宗门声望 +1）</span>');
        } else {
            rows.push('幡立起来半天，街上的人瞥了一眼，又各赶各的路——没人认得你，也没人认得这面幡。');
        }
        rows.push('官府差役来登了个册，临走打量了下空荡荡的四下：「掌门，就你一个人？」');
        rows.push('<span class="text-gray-400">没山门、没工坊、没进项。想有人来投，得挨家挨户去说——「游说招徒」在宗门总册里。</span>');
        modal('🚩 立幡当日', '<p class="text-sm text-amber-400 mb-2">「' + sect.name + '」草创第一日</p>' +
            rows.map(function (x) { return '<p class="text-sm text-gray-200 mb-2">' + x + '</p>'; }).join(''));
        street('城东立起一面新幡，号称「' + sect.name + '」。茶棚里没人说得清这是什么门派。');
    }

    // ============ 四 · 升格（赁屋 / 山门） ============
    function upgradeHouse() {
        var sect = mine();
        if (!sect) return { ok: false, reason: 'no-sect' };
        if (stageOf(sect) !== 0) return { ok: false, reason: 'not-cheap' };
        if (!deductStones(HOUSE_COST)) return { ok: false, reason: 'no-stones' };
        sect.stage = 1;
        var loc = city() || sect.location || '城中';
        sect.location = loc + '·赁屋';
        P().addHistory(sect.id, '在' + loc + '租下一进院子，二百灵石——总算有个能挂牌子的门脸。');
        registerInWorld(sect);
        return { ok: true };
    }
    // 择山门即升格（包装 chooseSite，旧账不动）
    try {
        if (P() && typeof P().chooseSite === 'function' && !P().chooseSite.__bootWrapped) {
            var _origChooseSite = P().chooseSite;
            P().chooseSite = function (sectId, siteId) {
                var r = _origChooseSite(sectId, siteId);
                try {
                    if (r && r.ok) {
                        var s = P().getSect(sectId);
                        if (s) { s.stage = 2; registerInWorld(s); }
                    }
                } catch (e) {}
                return r;
            };
            P().chooseSite.__bootWrapped = true;
        }
    } catch (e) {}

    // ============ 五 · 入户部账（座次、立场、劫掠都认它了） ============
    function registerInWorld(sect) {
        if (!sect || !sect.name) return false;
        var sd = (W.sectsData = W.sectsData || {});
        if (!sd[sect.name]) {
            var reg = CITY2REGION[sect.location] || CITY2REGION[String(sect.location || '').split('·')[0]] || '中州';
            sd[sect.name] = {
                name: sect.name, type: sect.alignment || '中立', power: '极小', location: reg,
                desc: '白手竖起的新幡，根基尚浅——江湖座次上，它得从最底下爬起。'
            };
        }
        // v35 入桶入册：分域宗门清单与世界图坐标都补上——自家山门从此在地图上看得见、点得着
        // 坐标按名哈希：同名永远同点，立宗之后幡不会读一次档挪一次窝
        try {
            var homeReg = sd[sect.name].location;
            if (W.sectsByRegion && W.sectsByRegion[homeReg] && W.sectsByRegion[homeReg].indexOf(sect.name) < 0) {
                W.sectsByRegion[homeReg].push(sect.name);
            }
            if (W.sectPositions && !W.sectPositions[sect.name]) {
                var hh = 5381;
                for (var hi = 0; hi < sect.name.length; hi++) hh = ((hh * 33) ^ sect.name.charCodeAt(hi)) >>> 0;
                W.sectPositions[sect.name] = { x: 60 + (hh % 680), y: 40 + ((hh >>> 10) % 440), color: '#fde68a' };
            }
        } catch (eReg) {}
        W.SECT_INTERNAL = W.SECT_INTERNAL || {};
        if (!W.SECT_INTERNAL[sect.name]) {
            W.SECT_INTERNAL[sect.name] = {
                disciples: (sect.disciples || []).length + (sect.guests || []).length,
                resources: Math.round((sect.resources && sect.resources.spiritStones) || 0),
                influence: Math.max(1, Math.round(sectFame(sect) / 2)),
                weapons: 0, defense: 0, morale: 50, grain: 30, chronicle: []
            };
        }
        // 第九波：对账基线在立宗当日就记下——否则首次月结会把立宗首月户部账上的累积当差额，整月清空
        if (sect._lastMirror == null) {
            try { sect._lastMirror = Math.round(Number((W.SECT_INTERNAL[sect.name] || {}).resources || 0)); } catch (e) {}
        }
        // 立场底色按出身走（sect-standing 首次读取时初始化）
        try { if (typeof W.sectAlignNow === 'function') W.sectAlignNow(sect.name); } catch (e) {}
        try { if (typeof W.sectPowerNow === 'function') W.sectPowerNow(sect.name); } catch (e) {}
        return true;
    }
    // 月度对账：户部账是面子，宗库是里子——外界落到面子上的进出（劫掠亏空 / 香火进项），真转回里子（守恒）
    function monthSync(sect) {
        var it = (W.SECT_INTERNAL || {})[sect.name];
        if (!it) { registerInWorld(sect); it = (W.SECT_INTERNAL || {})[sect.name]; if (!it) return; }
        it.disciples = (sect.disciples || []).length + (sect.guests || []).length;
        it.influence = Math.max(1, Math.round(sectFame(sect) / 2));
        if (sect._lastMirror != null) {
            var delta = Math.round(Number(it.resources || 0) - Number(sect._lastMirror));
            if (delta < 0) {
                var loss = -delta;
                sect.resources.spiritStones = Math.max(0, (sect.resources.spiritStones || 0) - loss);
                P().addHistory(sect.id, '江湖上遭了劫掠，宗库折损灵石 ' + loss + ' 枚。');
            } else if (delta > 0) {
                sect.resources.spiritStones = (sect.resources.spiritStones || 0) + delta;
                P().addHistory(sect.id, '江湖上得了进项（香火、护持之类），宗库添灵石 ' + delta + ' 枚。');
            }
        }
        it.resources = Math.round((sect.resources && sect.resources.spiritStones) || 0);
        it.weapons = Math.floor((sect.resources && sect.resources.weapon) || 0);
        sect._lastMirror = it.resources;
    }

    // ============ 六 · 游说招徒（四种话术，含撒谎） ============
    var CLAIMS = {
        1: { text: '门下弟子过百，堂口遍设各州', need: 10 },
        2: { text: '弟子三千，山门绵延百里', need: 30 }
    };
    function inSect(sect, npcId) {
        if ((sect.disciples || []).some(function (d) { return d.npcId === npcId; })) return true;
        if ((sect.guests || []).some(function (g) { return g.npcId === npcId; })) return true;
        return false;
    }
    function willingness(sect, npc) {
        var aff = Number((npc && npc.relationship && npc.relationship.affection) || (npc && npc.affection) || 0);
        var will = 15 + aff * 0.6 + playerFame() * 0.3 + stageOf(sect) * 5;
        var gap = tierOfRealm((npc.combat && npc.combat.realm) || npc.realm) - tierOfRealm((W.currentCharData || {}).realm);
        if (gap > 0) will -= gap * 25; // 修为高你的人，凭什么拜你
        return Math.max(2, Math.min(92, Math.round(will)));
    }
    function recruitCandidates() {
        var sect = mine();
        if (!sect) return [];
        var loc = city();
        var all = [];
        try { all = (W.npcManager && W.npcManager.getNearbyNPCs ? W.npcManager.getNearbyNPCs(loc) : []) || []; } catch (e) {}
        if (all.length < 3) {
            try {
                var more = (W.npcManager && W.npcManager.getAllNPCs ? W.npcManager.getAllNPCs() : []) || [];
                all = all.concat(more.filter(function (n) { return n && (n.state && n.state.location === loc || n.location === loc); }));
            } catch (e) {}
        }
        var seen = {}, out = [];
        all.forEach(function (n) {
            if (!n || !n.id || seen[n.id] || n.isDead) return;
            if (inSect(sect, n.id)) return;
            if (n._companionData || n.isCompanion) return; // 道侣不拿来当门徒
            seen[n.id] = 1;
            out.push({ id: n.id, name: n.name, realm: (n.combat && n.combat.realm) || n.realm || '修士', will: willingness(sect, n),
                old: (Number((n.relationship && n.relationship.affection) || n.affection || 0) >= 20) }); // 故人标记：有过交情的，名单上一眼认得出
        });
        out.sort(function (a, b) { return b.will - a.will; });
        return out.slice(0, 8);
    }
    function willWord(w) {
        if (w >= 60) return '大有可图';
        if (w >= 35) return '有几分心动';
        if (w >= 15) return '多半不理会';
        return '自认高你一等';
    }
    function doRecruit(npcId, approach) {
        var sect = mine();
        if (!sect) return { ok: false, reason: 'no-sect' };
        if (['ideal', 'show', 'pay', 'bluff'].indexOf(approach) < 0) return { ok: false, reason: 'bad-approach' };
        var day = today();
        if (!sect._drive || sect._drive.day !== day) sect._drive = { day: day, n: 0 };
        if (sect._drive.n >= DRIVE_DAY_CAP) {
            return { ok: false, reason: 'day-cap', text: '你今日已说得口干舌燥——游说这种事，一天说破了嘴也就五六家。明日再来。' };
        }
        var npc = null;
        try { npc = W.npcManager && W.npcManager.getNPC ? W.npcManager.getNPC(npcId) : null; } catch (e) {}
        if (!npc || npc.isDead) return { ok: false, reason: 'no-npc' };
        if (inSect(sect, npcId)) return { ok: false, reason: 'already' };
        // 第十八波：床铺不够就收不进来——先修屋，再收人
        try { if (W.PSectVenture && W.PSectVenture.bedsFull && W.PSectVenture.bedsFull(sect)) return { ok: false, reason: 'no-beds', text: '家里床铺不够了——先修缮屋子或升个住处，再收人。' }; } catch (eB) {}
        if (approach === 'pay' && stones() < DRIVE_PAY) {
            return { ok: false, reason: 'no-stones', text: '许好处要先掏出真好处——见面礼 ' + DRIVE_PAY + ' 灵石，你身上不够。' };
        }
        sect._drive.n++;
        try { if (typeof W.advanceTime === 'function') W.advanceTime(60, '登门游说'); } catch (e) {}

        var will = willingness(sect, npc);
        var bonus = 0, stage = stageOf(sect);
        if (approach === 'show') bonus = stage * 8 + Math.min(20, ((sect.disciples || []).length + (sect.guests || []).length) * 2) - (stage === 0 ? 15 : 0);
        else if (approach === 'pay') { bonus = 30; deductStones(DRIVE_PAY); }
        else if (approach === 'bluff') bonus = stage === 0 ? 45 : 30;
        // 第十八波：修好的破屋是「实底」，白手起家的名号是脸面——都进话术的分量
        try { if (W.PSectVenture) bonus += (W.PSectVenture.facade(sect) || 0) * 3 + (sect._title ? 5 : 0); } catch (eV) {}
        var chance = Math.max(5, Math.min(90, will + bonus));

        var roll = Math.random() * 100;
        if (roll < chance) {
            // 成了
            var rr = P().recruitDisciple(sect.id, npcId);
            if (!rr || !rr.ok) return { ok: false, reason: (rr && rr.reason) || 'recruit-failed' };
            var d = (sect.disciples || []).filter(function (x) { return x.npcId === npcId; })[0];
            if (d) { d.source = approach; d.name = npc.name; } // 名册刻名——人若身故，殁录上不至于只剩「一名修士」
            try {
                npc.relationship = npc.relationship || {};
                npc.relationship.affection = Math.min(100, Number(npc.relationship.affection || npc.affection || 0) + 5);
                if (npc.affection != null) npc.affection = npc.relationship.affection;
            } catch (e) {}
            var claimTier = stage === 0 ? 2 : 1;
            if (approach === 'bluff') {
                sect.lieDebt = { tier: claimTier, day: day };
                P().addHistory(sect.id, '游说「' + npc.name + '」时把门面说大了——「' + CLAIMS[claimTier].text + '」。这话出了口，就得用日子圆回来。');
            }
            var flavor = {
                'ideal': '「' + npc.name + '」被你说动了心——图的不是眼下的粮，是往后的名。',
                'show': '「' + npc.name + '」看了看你的家底，点了点头：还算实在。',
                'pay': '见面礼三十灵石递过去，「' + npc.name + '」掂了掂，收下了：「掌门大方。」',
                'bluff': '「' + npc.name + '」听得眼睛发亮——他信了你嘴里的' + CLAIMS[claimTier].text + '。'
            }[approach];
            return { ok: true, npcId: npcId, name: npc.name, approach: approach, text: flavor + '（拜入「' + sect.name + '」，记名弟子）' };
        }
        // 没成：拒绝的嘴脸分三档
        var sub = Math.random();
        if (sub < 0.7 || playerFame() >= 15) {
            return { ok: false, reason: 'refused', text: '「' + npc.name + '」听完，拱手：「好意心领。」门没敲开，话没传进去。' };
        } else if (sub < 0.9) {
            sect.resources.reputation = Math.max(0, (sect.resources.reputation || 0) - 1);
            return { ok: false, reason: 'mock', text: '「' + npc.name + '」笑出了声：「就这？」——笑声引得街坊都回头看。（宗门声望 -1）' };
        }
        sect.resources.reputation = Math.max(0, (sect.resources.reputation || 0) - 2);
        street('有人在' + (city() || '城里') + '挨家拉人入「' + sect.name + '」，被当街啐了回来。');
        return { ok: false, reason: 'rumor', text: '「' + npc.name + '」转头就把你的来意说给了街坊——半条街都在笑这面幡。（宗门声望 -2，街坊传开了）' };
    }

    // ============ 七 · 虚名债（吹出去的牛，月月等着兑现） ============
    function lieStatus(sect) {
        if (!sect || !sect.lieDebt) return null;
        var c = CLAIMS[sect.lieDebt.tier] || CLAIMS[1];
        var made = (sect.disciples || []).length >= c.need && (sect.lieDebt.tier === 1 || !!sect.terrain);
        return { tier: sect.lieDebt.tier, text: c.text, need: c.need, made: made, day: sect.lieDebt.day };
    }
    function bluffMonthCheck(sect) {
        var st = lieStatus(sect);
        if (!st) return;
        if (st.made) {
            sect.lieDebt = null;
            sect.resources.reputation = (sect.resources.reputation || 0) + 5;
            P().addHistory(sect.id, '当年吹出去的牛——「' + st.text + '」——如今都是真的了。江湖上反有人赞：这位掌门，说到做到。');
            street('茶棚里有人翻旧账：「' + sect.name + '」当年立幡时说' + st.text + '，如今你再去看看——人家真做到了。');
            return;
        }
        var risk = sect._bluffExposed ? 0.4 : 0.25;
        if (Math.random() >= risk) return;
        // 穿帮
        sect.lieDebt = null;
        sect._bluffExposed = true;
        sect.resources.reputation = Math.max(0, (sect.resources.reputation || 0) - 8);
        try {
            var cd = W.currentCharData;
            if (cd) cd.fame = Math.max(0, (cd.fame || 0) - 2);
        } catch (e) {}
        var left = 0;
        (sect.disciples || []).slice().forEach(function (d) {
            if (d.source === 'bluff' && Math.random() < 0.4) {
                P().dismissDisciple(sect.id, d.npcId);
                P().addHistory(sect.id, '「' + npcName(d.npcId) + '」发现上了当，连夜收拾包袱走了。');
                left++;
            }
        });
        var line = '茶棚笑柄：「' + sect.name + '」的山门是掌门嘴里造的——' + st.text + '，鬼影都没一个！';
        street(line);
        chron(sect.name, '虚名穿帮：' + st.text + '被街坊戳破，声望扫地' + (left ? '，' + left + '名受哄骗而来的弟子离门' : '') + '。');
        P().addHistory(sect.id, '吹出去的门面穿帮了。街上都在笑话——这比没钱更伤人。（宗门声望 -8，你的名望 -2）');
        // 第十八波：穿帮上官府的档簿（虚名也是违规，档满三笔有除名之危）
        try { if (W.PSectVenture && W.PSectVenture.onViolation) W.PSectVenture.onViolation(sect, 'bluff'); } catch (eGov) {}
    }

    // ============ 八 · 门客（客卿：雇来的帮工，月俸真扣） ============
    function hireRetainer(npcId) {
        var sect = mine();
        if (!sect) return { ok: false, reason: 'no-sect' };
        sect.guests = sect.guests || [];
        if (sect.guests.length >= 10) return { ok: false, reason: 'guest-cap', text: '院里统共这么多间屋——门客十位，住满了。' };
        var npc = null;
        try { npc = W.npcManager && W.npcManager.getNPC ? W.npcManager.getNPC(npcId) : null; } catch (e) {}
        if (!npc || npc.isDead) return { ok: false, reason: 'no-npc' };
        if (inSect(sect, npcId)) return { ok: false, reason: 'already' };
        var will = 35 + Number((npc.relationship && npc.relationship.affection) || 0) * 0.5 + playerFame() * 0.4 + stageOf(sect) * 5;
        var gap = tierOfRealm((npc.combat && npc.combat.realm) || npc.realm) - tierOfRealm((W.currentCharData || {}).realm);
        if (gap > 0) will -= gap * 20;
        if (Math.random() * 100 >= Math.max(5, Math.min(90, will))) {
            return { ok: false, reason: 'refused', text: '「' + npc.name + '」摆手：「受雇看家护院？我还没落魄到那份上。」' };
        }
        sect.guests.push({ npcId: npcId, name: npcName(npcId), day: today(), salary: GUEST_SALARY });
        P().addHistory(sect.id, '聘「' + npc.name + '」为客卿，月俸灵石五枚——帮工看场子，不入族谱名分。');
        return { ok: true, npcId: npcId, name: npc.name };
    }
    function fireRetainer(npcId) {
        var sect = mine();
        if (!sect) return false;
        var i = (sect.guests || []).findIndex(function (g) { return g.npcId === npcId; });
        if (i < 0) return false;
        var nm = npcName(npcId);
        sect.guests.splice(i, 1);
        P().addHistory(sect.id, '辞了客卿「' + nm + '」，结清俸银，好聚好散。');
        return true;
    }

    // ============ 九 · 日结包装（产出按建筑和人走 + 月结俸银/投奔/虚名/对账） ============
    function monthTick(sect, day) {
        // 第十七波：幡倒了的宗门不发俸、不对账——灯灭了，账封着（复兴完工时由 PSectWorld 重新开账）
        if (sect._ruined) return;
        // 第九波·殁录清册：人没了就不能挂在名册上领俸——除名、记殁、停俸（弟子/门客/亲传名分三本册都清）
        try {
            var _nm = W.npcManager;
            var _gone = function (id) { var n = _nm && _nm.getNPC ? _nm.getNPC(id) : null; return !n || !!n.isDead; };
            var _i;
            for (_i = (sect.disciples || []).length - 1; _i >= 0; _i--) {
                var _dd = sect.disciples[_i];
                if (_dd && _gone(_dd.npcId)) {
                    P().addHistory(sect.id, '「' + (_dd.name || npcName(_dd.npcId)) + '」故去了——名册除名，门中致哀，俸银自本月停发。');
                    sect.disciples.splice(_i, 1);
                }
            }
            for (_i = (sect.guests || []).length - 1; _i >= 0; _i--) {
                var _gg = sect.guests[_i];
                if (_gg && _gone(_gg.npcId)) {
                    P().addHistory(sect.id, '客卿「' + (_gg.name || npcName(_gg.npcId)) + '」故去了——账结到人，客册除名。');
                    sect.guests.splice(_i, 1);
                }
            }
            sect.resources.disciples = (sect.disciples || []).length;
            var _dsx = W.discipleState;
            if (_dsx && Object.prototype.toString.call(_dsx._myDisciples) === '[object Array]') {
                _dsx._myDisciples = _dsx._myDisciples.filter(function (id) { return !_gone(id); });
            }
        } catch (e) {}
        // 俸银：弟子月俸二、门客月俸五——发不出，人就散
        var disc = sect.disciples || [], guests = sect.guests || [];
        var salary = disc.length * DISC_SALARY + guests.length * GUEST_SALARY;
        if (salary > 0) {
            var have = Number(sect.resources.spiritStones || 0);
            if (have >= salary) {
                sect.resources.spiritStones = have - salary;
                P().addHistory(sect.id, '月俸发放：弟子 ' + disc.length + ' 人、客卿 ' + guests.length + ' 位，共灵石 ' + salary + ' 枚。');
                try { if (W.PSectVenture && W.PSectVenture.onSalary) W.PSectVenture.onSalary(sect, true); } catch (eSal) {}
            } else {
                // 欠俸：门客当场散，弟子挨饿，各凭心意去留
                guests.slice().forEach(function (g) {
                    P().addHistory(sect.id, '俸银发不出，客卿「' + npcName(g.npcId) + '」拱拱手，走了。');
                });
                sect.guests = [];
                disc.slice().forEach(function (d) {
                    // 第十八波：观望的先走，死心塌地的能再扛扛——心境进真结算
                    var _lc = 0.25;
                    try { if (W.PSectVenture && W.PSectVenture.leaveChance) _lc = W.PSectVenture.leaveChance(d); } catch (eLc) {}
                    if (Math.random() < _lc) {
                        P().dismissDisciple(sect.id, d.npcId);
                        P().addHistory(sect.id, '库里发不出俸银，「' + (d.name || npcName(d.npcId)) + '」熬不住饥，夜里走了。');
                    }
                });
                street('「' + sect.name + '」连俸银都发不出了——门里的人开始往外走。');
                try { if (W.PSectVenture && W.PSectVenture.onSalary) W.PSectVenture.onSalary(sect, false); } catch (eSal2) {}
            }
        }
        // 主动投奔：有名望、有门脸，才有人自己找上门
        var fame = sectFame(sect);
        // 第十八波：床铺满了，慕名的人到了门口也只能拱手——先修屋
        var _bedsOk = true;
        try { _bedsOk = !(W.PSectVenture && W.PSectVenture.bedsFull && W.PSectVenture.bedsFull(sect)); } catch (eBd) {}
        if (stageOf(sect) >= 1 && fame >= 40 && _bedsOk) {
            var p = Math.min(0.5, (fame - 30) / 150);
            if (Math.random() < p) {
                var pool = [];
                try {
                    var myTier = tierOfRealm((W.currentCharData || {}).realm);
                    pool = ((W.npcManager && W.npcManager.getAllNPCs ? W.npcManager.getAllNPCs() : []) || [])
                        .filter(function (n) {
                            if (!n || !n.id || n.isDead || inSect(sect, n.id) || n._companionData || n.isCompanion) return false;
                            return tierOfRealm((n.combat && n.combat.realm) || n.realm) - myTier <= 1; // 修为高你太多的人，不会慕名来拜
                        });
                } catch (e) {}
                if (pool.length) {
                    var who = pool[Math.floor(Math.random() * pool.length)];
                    var rr = P().recruitDisciple(sect.id, who.id);
                    if (rr && rr.ok) {
                        var dd = (sect.disciples || []).filter(function (x) { return x.npcId === who.id; })[0];
                        if (dd) { dd.source = 'fame'; dd.name = who.name; }
                        P().addHistory(sect.id, '「' + who.name + '」慕名上门投奔——名声传出去了，人自己会来。');
                        if (stageOf(sect) === 2 && fame >= 80 && Math.random() < 0.3) {
                            var who2 = pool.filter(function (n) { return n.id !== who.id; })[Math.floor(Math.random() * Math.max(1, pool.length - 1))];
                            if (who2) {
                                var rr2 = P().recruitDisciple(sect.id, who2.id);
                                if (rr2 && rr2.ok) P().addHistory(sect.id, '「' + who2.name + '」是跟着同乡一道来投的。');
                            }
                        }
                    }
                }
            }
        }
        bluffMonthCheck(sect);
        monthSync(sect);
    }
    function correctDaily(sect, before) {
        var stage = stageOf(sect);
        var r = sect.resources;
        var guests = (sect.guests || []).length;
        if (sect._ruined) {
            // 第十七波：幡倒了就分文不产——原样退回（复兴完工才重新开账）
            r.spiritStones = before.spiritStones; r.reputation = before.reputation;
            r.elixir = before.elixir; r.weapon = before.weapon;
            return;
        }
        if (stage === 0) {
            // 草创：没田没坊没人，分文不产，也无人可食——原样退回
            r.spiritStones = before.spiritStones; r.reputation = before.reputation;
            r.elixir = before.elixir; r.weapon = before.weapon;
            return;
        }
        if (stage === 1) {
            // 赁屋：掌门带着门客打零工——每日灵石一，门客每位帮工半枚
            r.reputation = before.reputation; r.elixir = before.elixir; r.weapon = before.weapon;
            r.spiritStones = before.spiritStones + 1 + guests * 0.5;
            return;
        }
        // 山门：原口径照走，但丹药兵器得有人做——零人手则不出（能量守恒）
        var workers = (sect.disciples || []).length + guests;
        if (workers === 0) { r.elixir = before.elixir; r.weapon = before.weapon; }
        else { r.spiritStones = (r.spiritStones || 0) + guests * 0.5; }
    }
    try {
        if (P() && typeof P().tickDay === 'function' && !P().tickDay.__bootWrapped) {
            var _origTick = P().tickDay;
            P().tickDay = function () {
                var day = today();
                var mine0 = null;
                var before = null;
                try {
                    mine0 = mine();
                    if (mine0) {
                        before = JSON.parse(JSON.stringify(mine0.resources));
                        mine0.guests = mine0.guests || [];
                        registerInWorld(mine0);
                    }
                } catch (e) {}
                var r0 = _origTick.apply(this, arguments);
                try {
                    if (mine0 && before) {
                        correctDaily(mine0, before);
                        if (day && day % 30 === 0) monthTick(mine0, day);
                    }
                } catch (e) {}
                return r0;
            };
            P().tickDay.__bootWrapped = true;
        }
    } catch (e) {}

    // ============ 十 · 面板插块（宗门总册里的「白手起家」一栏） ============
    function panelBlock(sect) {
        if (!sect) return '';
        var stage = stageOf(sect);
        var h = '<div class="bg-gray-800/60 border border-gray-600 rounded p-2 mb-3">';
        h += '<p class="text-sm text-amber-400 mb-1">白手起家 · ' + STAGE_NAME[stage] + '</p>';
        h += '<p class="text-xs text-gray-400 mb-2">门面名声约 ' + sectFame(sect) + ' —— ' +
            (sectFame(sect) >= 40 && stage >= 1 ? '已有人慕名投奔' : '还没人主动来投，得挨家去说') + '</p>';
        if (sect._ruined) {
            // 第十七波：幡倒了——总册只剩遗卷与两条出路
            h += '<p class="text-xs text-red-300 mt-2">幡倒了——宗谱转另册·遗卷。找回三位老相识、凑五百灵石、回旧址起土，山门还能重立；也可就此彻底散伙，另竖新幡。</p>'
                + '<button onclick="window.PSectWorld.openPSectBook()" class="bg-stone-700 hover:bg-stone-600 text-white text-xs px-3 py-1 rounded mr-2">📖 宗谱·遗卷</button>'
                + '<button onclick="window.sectRuinView && window.sectRuinView(\'' + sect.name + '\')" class="bg-emerald-800 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded mr-2">🥀 回旧址看看</button>'
                + '<button onclick="window.PSectWorld.dissolveRuinedAsk()" class="bg-gray-700 hover:bg-red-900 text-gray-300 text-xs px-3 py-1 rounded">💔 彻底散伙</button>';
            h += '</div>';
            return h;
        }
        if (stage === 0) {
            h += '<p class="text-xs text-gray-400 mb-2">一无片瓦，二无进项——城里赁一进院子（' + HOUSE_COST + ' 灵石，自掏），才算有个门脸。</p>' +
                '<button onclick="window._psUpgradeHouse()" class="bg-yellow-700 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded mr-2">赁屋立门脸</button>';
        } else if (stage === 1 && !sect.terrain) {
            h += '<p class="text-xs text-gray-400 mb-2">赁来的院子终归是赁来的——挣下家底、修到元婴，再去择一处真山门。</p>';
        }
        h += '<button onclick="window._psOpenDrive()" class="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded mr-2">游说招徒</button>';
        h += '<button onclick="window._psOpenGuest()" class="bg-sky-800 hover:bg-sky-700 text-white text-xs px-3 py-1 rounded">门客（' + (sect.guests || []).length + ' 位）</button>';
        var st = lieStatus(sect);
        if (st) {
            h += '<p class="text-xs text-red-300 mt-2">你在外面说过大话：「' + st.text + '」——' +
                (st.made ? '眼看要圆上了。' : '门中现有 ' + (sect.disciples || []).length + ' 人。兑不上，早晚穿帮；穿帮一次，往后撒谎更易被戳穿。') + '</p>';
        }
        // 第十七波 · 自建宗门四条线：宗谱腰牌 / 盛会主办 / 城市香火——掌门自己的江湖
        h += '<div class="mt-2">'
            + '<button onclick="window.PSectWorld.openPSectBook()" class="bg-stone-700 hover:bg-stone-600 text-white text-xs px-3 py-1 rounded mr-2">📖 宗谱腰牌</button>'
            + '<button onclick="window.PSectWorld.hostGala()" class="bg-amber-800 hover:bg-amber-700 text-white text-xs px-3 py-1 rounded">🎪 主办盛会（灵石二百六，一年一回）</button>'
            + '</div>';
        h += '</div>';
        try { if (W.SectCities && typeof W.SectCities.panelBlock === 'function') h += W.SectCities.panelBlock(sect.name); } catch (eC) {}
        return h;
    }

    // ============ 十一 · 界面入口 ============
    W._psDoFoundCheap = function () {
        try {
            if (W._psKeepFoundName) W._psKeepFoundName();
            var el = document.getElementById('ps-found-name');
            var name = ((el && el.value) || '').trim();
            var align = (W._psDraftState && W._psDraftState.alignment) || '中立';
            var r = foundCheap(name, align);
            if (!r.ok) {
                var reasons = {
                    'no-name': '宗名总得有两三个字。',
                    'has-sect': '已经立过宗了。',
                    'in-other-sect': '你还在别家门下当差——先出师、叛门或告老，再来竖自己的幡。',
                    'name-taken': '江湖上已有这块山门的名号，换一个。',
                    'no-stones': '连三十灵石的幡布香烛都凑不齐——先去挣第一桶金。'
                };
                msg(reasons[r.reason] || '立幡未成。', 'warning');
                return;
            }
            try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {}
            msg('🚩 一面幡立起来了——「' + name + '」自此开宗。家底是空的，路是长的。', 'success');
            if (W.updateCultivationUI) W.updateCultivationUI();
            cheapFoundingDay(r.sect);
        } catch (e) { msg('立幡未成。', 'error'); }
    };
    W._psUpgradeHouse = function () {
        var r = upgradeHouse();
        if (r.ok) { msg('院子租下了——「' + (mine() || {}).name + '」总算有个门脸。', 'success'); }
        else msg(r.reason === 'no-stones' ? ('赁屋要 ' + HOUSE_COST + ' 灵石，自掏——先去凑。') : '眼下赁不了屋。', 'warning');
        if (W.openPlayerSectPanel) W.openPlayerSectPanel();
    };
    W._psOpenDrive = function () {
        var sect = mine();
        if (!sect) return;
        var cands = recruitCandidates();
        var st = lieStatus(sect);
        var h = '<p class="text-xs text-gray-400 mb-2">挨家登门，一天说破嘴也就五六家。话术四种：' +
            '晓之以理（凭脸面与志向）、亮实底（家底越实越服人，草创班子说出来寒碜）、许好处（见面礼 ' + DRIVE_PAY + ' 灵石，自掏）、' +
            '吹牛（把门面说大，最易说动——但虚名是债，兑不上早晚穿帮）。</p>';
        if (st) h += '<p class="text-xs text-red-300 mb-2">身上背着虚名债：「' + st.text + '」。再吹，穿帮更快。</p>';
        if (!cands.length) {
            h += '<p class="text-sm text-gray-500">眼下这座城里，还没可说动的人——换座城，或先把名声做起来。</p>';
        } else {
            // 第九波·明面：候选人按意愿分色带（绿=说得动，黄=有几分心动，灰=多半不理会，红=自认高你一等），
            // 故人有标记，吹牛加红边示警——危险选项不再跟安全选项长得一模一样
            h += cands.map(function (c) {
                var band = c.will >= 60 ? 'border-l-green-500' : (c.will >= 35 ? 'border-l-yellow-500' : (c.will >= 15 ? 'border-l-gray-500' : 'border-l-red-700'));
                return '<div class="bg-gray-900/50 px-3 py-2 rounded border border-gray-700 border-l-4 ' + band + ' mb-2">' +
                    '<div class="flex justify-between items-center"><span class="text-gray-100 text-sm">' + c.name +
                    (c.old ? ' <span class="text-xs text-amber-300">故人</span>' : '') +
                    ' <span class="text-xs text-blue-300">[' + c.realm + ']</span></span>' +
                    '<span class="text-xs text-gray-400">' + willWord(c.will) + '</span></div>' +
                    '<div class="flex gap-1 mt-1">' +
                    '<button onclick="window._psDrive(\'' + c.id + '\',\'ideal\')" class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded">晓之以理</button>' +
                    '<button onclick="window._psDrive(\'' + c.id + '\',\'show\')" class="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded">亮实底</button>' +
                    '<button onclick="window._psDrive(\'' + c.id + '\',\'pay\')" class="bg-yellow-700 hover:bg-yellow-600 text-gray-900 text-xs px-2 py-1 rounded">许好处</button>' +
                    '<button onclick="window._psDrive(\'' + c.id + '\',\'bluff\')" class="bg-red-800 hover:bg-red-700 ring-1 ring-red-500 text-white text-xs px-2 py-1 rounded">吹牛</button>' +
                    '</div></div>';
            }).join('');
        }
        modal('游说招徒 · ' + sect.name, h);
    };
    W._psDrive = function (npcId, approach) {
        var r = doRecruit(npcId, approach);
        if (r.ok) { msg(r.text, 'success'); W._psOpenDrive(); }
        else msg(r.text || '没说得动。', r.reason === 'day-cap' ? 'info' : 'warning');
        if (r.reason === 'day-cap') { try { var ov = document.getElementById('xianxia-modal-overlay'); if (ov) ov.remove(); } catch (e) {} }
    };
    W._psOpenGuest = function () {
        var sect = mine();
        if (!sect) return;
        sect.guests = sect.guests || [];
        var loc = city();
        var pool = [];
        try { pool = (W.npcManager && W.npcManager.getNearbyNPCs ? W.npcManager.getNearbyNPCs(loc) : []) || []; } catch (e) {}
        var ids = {};
        (sect.disciples || []).forEach(function (d) { ids[d.npcId] = 1; });
        sect.guests.forEach(function (g) { ids[g.npcId] = 1; });
        var cands = pool.filter(function (n) { return n && n.id && !n.isDead && !ids[n.id] && !n._companionData && !n.isCompanion; }).slice(0, 6);
        var h = '<p class="text-xs text-gray-400 mb-2">门客是雇来的帮工：不入族谱名分，月俸灵石五枚（宗库真扣），赁屋之上每位帮工日进半枚；欠俸即散。</p>';
        if (sect.guests.length) {
            h += '<p class="text-sm text-amber-400 mb-1">在雇门客</p>' + sect.guests.map(function (g) {
                // 第二十二波：客卿也能遣下山——行踪在档的显示归期，在山的给「遣」字按钮
                var awayTag = g.away
                    ? '<span class="text-sky-300 text-xs mr-1">🚶 下山' + (g.away.name || '办事') + '·还有' + Math.max(1, (Number(g.away.back) || 0) - today()) + '日回</span>'
                    : (W.PSectLife ? '<button onclick="window.PSectLife.openDispatch(\'' + g.npcId + '\')" class="bg-sky-800 hover:bg-sky-700 text-white text-xs px-2 py-1 rounded mr-1">遣</button>' : '');
                return '<div class="bg-gray-900/50 px-3 py-2 rounded border border-gray-700 mb-1 flex justify-between items-center">' +
                    '<span class="text-gray-100 text-sm">' + npcName(g.npcId) + ' <span class="text-xs text-gray-400">月俸 ' + (g.salary || GUEST_SALARY) + '</span></span>' +
                    '<span>' + awayTag + '<button onclick="window._psFireGuest(\'' + g.npcId + '\')" class="bg-gray-700 hover:bg-red-900 text-gray-300 text-xs px-2 py-1 rounded">辞</button></span></div>';
            }).join('');
        }
        h += '<p class="text-sm text-amber-400 mb-1 mt-2">城里可聘的人</p>';
        h += cands.length ? cands.map(function (n) {
            return '<div class="bg-gray-900/50 px-3 py-2 rounded border border-gray-700 mb-1 flex justify-between items-center">' +
                '<span class="text-gray-100 text-sm">' + n.name + ' <span class="text-xs text-blue-300">[' + ((n.combat && n.combat.realm) || n.realm || '修士') + ']</span></span>' +
                '<button onclick="window._psHire(\'' + n.id + '\')" class="bg-sky-800 hover:bg-sky-700 text-white text-xs px-2 py-1 rounded">聘（月俸五灵石）</button></div>';
        }).join('') : '<p class="text-xs text-gray-500">这座城里暂无可聘的闲人。</p>';
        modal('门客 · ' + sect.name, h);
    };
    W._psHire = function (npcId) {
        var r = hireRetainer(npcId);
        if (r.ok) msg('「' + r.name + '」受了聘，月俸五灵石，明日开工。', 'success');
        else msg(r.text || '没聘成。', 'warning');
        W._psOpenGuest();
    };
    W._psFireGuest = function (npcId) {
        if (fireRetainer(npcId)) msg('客卿已辞，结清俸银。', 'info');
        W._psOpenGuest();
    };

    // ============ 导出 ============
    // 第九波：给外界模块认「这是不是玩家自建宗门」——AI 代管、灭门扫描、配对池都凭它让路
    function isPlayerSect(name) {
        try {
            var ms = (P() && P().listMySects) ? P().listMySects() : [];
            for (var i = 0; i < ms.length; i++) { if (ms[i] && ms[i].name === name) return true; }
        } catch (e) {}
        return false;
    }
    W.PSBoot = {
        BANNER_COST: BANNER_COST, HOUSE_COST: HOUSE_COST, GUEST_SALARY: GUEST_SALARY,
        DISC_SALARY: DISC_SALARY, DRIVE_PAY: DRIVE_PAY, DRIVE_DAY_CAP: DRIVE_DAY_CAP,
        CLAIMS: CLAIMS, STAGE_NAME: STAGE_NAME,
        stageOf: stageOf, sectFame: sectFame, foundCheap: foundCheap, upgradeHouse: upgradeHouse,
        registerInWorld: registerInWorld, monthSync: monthSync, recruitCandidates: recruitCandidates,
        doRecruit: doRecruit, hireRetainer: hireRetainer, fireRetainer: fireRetainer,
        lieStatus: lieStatus, bluffMonthCheck: bluffMonthCheck, monthTick: monthTick,
        panelBlock: panelBlock, cheapFoundingDay: cheapFoundingDay, willWord: willWord,
        isPlayerSect: isPlayerSect
    };
    // 立宗即入江湖（外交落座由 sect-war 的既有钩子办，这里补户部账）
    try {
        if (W.EventBus && W.EventBus.on) {
            W.EventBus.on('playerSect:created', function (p) { try { if (p && p.sect) registerInWorld(p.sect); } catch (e) {} });
        }
    } catch (e) {}

    // 探针（测试用）
    W.sectBootstrapProbe = function () {
        var sect = mine();
        if (!sect) return null;
        return {
            name: sect.name, stage: stageOf(sect), fame: sectFame(sect),
            stones: Number(sect.resources.spiritStones || 0), rep: Number(sect.resources.reputation || 0),
            disciples: (sect.disciples || []).length, guests: (sect.guests || []).length,
            lieDebt: lieStatus(sect), drive: sect._drive || null,
            registered: !!(W.sectsData && W.sectsData[sect.name]),
            internal: !!(W.SECT_INTERNAL && W.SECT_INTERNAL[sect.name])
        };
    };
    console.log('[player-sect-bootstrap] 白手起家已注册：开局可插旗草创（无建筑零产出没人来）+ 游说招徒四话术（吹牛记虚名债，穿帮有真代价）+ 门客月俸 + 户部账同步');
})();
