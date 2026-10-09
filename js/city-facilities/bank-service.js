// js/city-facilities/bank-service.js — 钱庄账房：存款按月起息、欠条到期成真、逾期有人上门
// v20.18：把牌匾上写过的话全部做实。银钱一律走统一结算事务（RewardService→EconomyTransaction），
// 本模块只管账本（_bank 字段，随存档白名单成对往返）与新日催收钩子。
(function (global) {
    'use strict';

    var MONTH_DAYS = 30;          // 一游戏月 30 日
    var DEPOSIT_RATE = 0.05;      // 存月息五
    var LOAN_RATE = 0.2;          // 借一还二成息（借100一月后还120）
    var LOAN_TERM = 30;           // 借期一月
    // ---- v27.1 营生扩展批：放印子钱（玩家做放贷那一头，钱庄居中作保）----
    var LEND_RATE = 0.2;          // 放一收二成息（与借字同价——钱庄抽的头已算在里头）
    var LEND_TERM = 30;           // 放期一月
    var LEND_MIN = 100;           // 单笔起放
    var LEND_MAX_EACH = 500;      // 单笔封顶（大额要抵押，柜上不替你抵押）
    var LEND_MAX_ACTIVE = 2;      // 同时在外的欠条至多两张
    var LEND_REPAY_P = 0.80;      // 到期如约连本带息（十有八九）
    var LEND_LATE_P = 0.15;       // 到期苦求宽限十日（账照旧）
    // 余下 5%：卷铺盖跑路——柜上追债人出门追十五日，六成追回本金（息没了），四成坏账
    var LEND_CHASE_DAYS = 15;
    var LEND_CHASE_BACK_P = 0.6;

    function num(v) { return Number(v) || 0; }
    function char() { return global.currentCharData || null; }
    function day() { return (typeof global.getAbsoluteDay === 'function') ? global.getAbsoluteDay() : 0; }
    function stonesNow() {
        if (global.XianXia && global.XianXia.DataManager) return num(global.XianXia.DataManager.getSpiritStones());
        var p = char();
        return p ? num(p.spiritStones) : 0;
    }
    function payStones(delta, spec) {
        if (!global.RewardService) return { success: false, reason: 'reward_service_unavailable' };
        var s = { stones: delta };
        if (spec) for (var k in spec) s[k] = spec[k];
        return global.RewardService.apply(s, { source: 'bank' });
    }
    // 账本懒初始化（挂在角色 _bank 上，随 game-state 白名单入档——单一真源，无平行状态）
    function ledger() {
        var p = char();
        if (!p) return null;
        if (!p._bank || typeof p._bank !== 'object') p._bank = { deposit: 0, depStart: 0, debt: 0, debtDue: 0 };
        var b = p._bank;
        b.deposit = Math.max(0, num(b.deposit));
        b.depStart = num(b.depStart);
        b.debt = Math.max(0, num(b.debt));
        b.debtDue = num(b.debtDue);
        b.lastCol = num(b.lastCol);
        // v27.1 放出去的欠条（印子钱账）——归一化：坏账不进门，字段全夹板
        if (!Array.isArray(b.loansOut)) b.loansOut = [];
        b.loansOut = b.loansOut.filter(function (l) {
            return l && typeof l === 'object' && num(l.amount) > 0 && (l.state === 'active' || l.state === 'chase');
        }).slice(0, LEND_MAX_ACTIVE + 2).map(function (l) {
            return {
                amount: Math.max(1, Math.floor(num(l.amount))),
                outDay: Math.floor(num(l.outDay)),
                dueDay: Math.floor(num(l.dueDay)),
                state: l.state === 'chase' ? 'chase' : 'active',
                lateCount: Math.max(0, Math.min(99, Math.floor(num(l.lateCount)))),
                chaseUntil: Math.floor(num(l.chaseUntil))
            };
        });
        return b;
    }
    function log(m, t) { (global.gameLog || { add: function () {} }).add(m, t || 'info'); }
    // v25.8 黑道批：抢过柜台的人，钱庄对你闭门三日（通缉账在 npc-crime.js，本闸守卫式读取——不在位就永不闭门）
    function banGate() {
        try {
            if (global.NpcCrime && typeof global.NpcCrime.bankBanned === 'function' && global.NpcCrime.bankBanned()) {
                var d = (typeof global.NpcCrime.bankBanDays === 'function') ? global.NpcCrime.bankBanDays() : 0;
                return { error: '钱庄的门板对你上着（还有 ' + d + ' 日）——上回柜台前的事，伙计们都记着呢。' };
            }
        } catch (e) { console.warn('[静默失败] js/city-facilities/bank-service.js · banGate：闭门账没问成，按开着门算', e && e.message); }
        return null;
    }

    var BankService = {
        // 只读口径（面板/情境文案共用）
        summary: function () {
            var b = ledger();
            if (!b) return null;
            var months = b.deposit > 0 ? Math.floor(Math.max(0, day() - b.depStart) / MONTH_DAYS) : 0;
            var interest = Math.round(b.deposit * DEPOSIT_RATE * months);
            // v27.1 放出去的欠条（印子钱）也上汇总牌面
            var outActive = 0, outChase = 0, outPrincipal = 0;
            (b.loansOut || []).forEach(function (l) {
                outPrincipal += l.amount;
                if (l.state === 'chase') outChase++; else outActive++;
            });
            return {
                deposit: b.deposit, depStart: b.depStart, debt: b.debt, debtDue: b.debtDue,
                months: months, interest: interest,
                owed: b.debt > 0 ? Math.round(b.debt * (1 + LOAN_RATE)) : 0,
                overdue: b.debt > 0 && day() > b.debtDue,
                loansOut: b.loansOut || [], outActive: outActive, outChase: outChase, outPrincipal: outPrincipal
            };
        },

        // 真实小世界·钱票（world-ledger）：大额银钱换成钱票随身——票无重量不可抢，
        // 异地钱庄凭票取现，开票抽二分水费。巨贾走商不再背着钱山赶路。
        buyTicket: function (amount) {
            var ban = banGate();
            if (ban) return ban;
            amount = Math.floor(num(amount));
            if (amount < 100) return { error: '钱票起点 100 灵石——零钱柜上不票据化' };
            var wallet = (global.inventory && global.inventory.currency) ? global.inventory.currency : null;
            var cd = global.currentCharData;
            var have = wallet ? (Number(wallet.spiritStones) || 0) : (cd ? (Number(cd.spiritStones) || 0) : 0);
            if (have < amount) return { error: '身上灵石不足 ' + amount + '，开不出这张票' };
            var wl = global.WorldLedger;
            if (!wl || typeof wl.issueTicket !== 'function') return { error: '柜上票据簿不在手边' };
            if (wallet) wallet.spiritStones = have - amount;
            if (cd) cd.spiritStones = wallet ? wallet.spiritStones : have - amount;
            var fee = Math.floor(amount * 0.02); // 开票即收二分水费——工本与保兑
            var tk = wl.issueTicket(amount - fee);
            return { success: true, ticket: tk, messages: ['钱票写就：凭票即付 ' + (amount - fee) + ' 灵石（开票水费 ' + fee + '）——票在囊中轻如无物，异地本号分柜皆可兑。'] };
        },
        redeemTicket: function () {
            var wl = global.WorldLedger;
            if (!wl || typeof wl.redeemTicket !== 'function') return { error: '柜上票据簿不在手边' };
            var tk = wl.redeemTicket(); // 兑手中最早一张（异地分号通兑）
            if (!tk) return { error: '你身上没有钱票' };
            var wallet = (global.inventory && global.inventory.currency) ? global.inventory.currency : null;
            var cd = global.currentCharData;
            if (wallet) wallet.spiritStones = (Number(wallet.spiritStones) || 0) + tk.amount;
            if (cd) cd.spiritStones = wallet ? wallet.spiritStones : (Number(cd.spiritStones) || 0) + tk.amount;
            return { success: true, amount: tk.amount, messages: ['钱票兑现：' + tk.amount + ' 灵石落袋（' + (tk.issueCity || '他城') + '开票，本柜保兑）。'] };
        },

        deposit: function (amount) {
            var ban = banGate();
            if (ban) return ban;
            var b = ledger();
            if (!b) return { error: '钱庄不与无名氏打交道' };
            amount = Math.floor(num(amount));
            if (amount <= 0) return { error: '请带些灵石再来' };
            if (stonesNow() < amount) return { error: '手头灵石不足' };
            var msgs = [];
            // 利随本清再并账：旧存款先结息付讫，本笔并入后全新一月一息
            if (b.deposit > 0) {
                var s = BankService.summary();
                if (s.interest > 0) {
                    var pr = payStones(s.interest);
                    if (!pr || !pr.success) return { error: '利息结算未成，掌柜摇了摇头' };
                    msgs.push('旧存结息 + ' + s.interest + ' 灵石');
                }
            }
            var r = payStones(-amount);
            if (!r || !r.success) return { error: '灵石不足，交易未成' };
            b.deposit += amount;
            b.depStart = day();
            msgs.push('存入 ' + amount + ' 灵石，月息五，起息今日（存款 ' + b.deposit + '）');
            log('你存入 ' + amount + ' 灵石，掌柜当街唱喏、登簿画押。' + (msgs.length > 1 ? '旧的利息也当场结清了。' : ''), 'success');
            return { success: true, messages: msgs };
        },

        withdraw: function () {
            var ban = banGate();
            if (ban) return ban;
            var b = ledger();
            if (!b) return { error: '钱庄不与无名氏打交道' };
            if (b.deposit <= 0) return { error: '你在钱庄没有存款' };
            var s = BankService.summary();
            var total = b.deposit + s.interest;
            var r = payStones(total);
            if (!r || !r.success) return { error: '钱庄兑付未成，再试一次' };
            b.deposit = 0;
            b.depStart = day();
            log('你取回存款 ' + s.deposit + ' 灵石' + (s.interest > 0 ? '，另结利息 ' + s.interest + ' 灵石' : '（未满一月无息）') + '，账页当场注销。', 'success');
            return { success: true, messages: ['取出 ' + s.deposit + ' + 息 ' + s.interest + ' 灵石'] };
        },

        borrow: function (amount) {
            var ban = banGate();
            if (ban) return ban;
            var b = ledger();
            if (!b) return { error: '钱庄不与无名氏打交道' };
            if (b.debt > 0) return { error: '欠条未销，钱庄不再放贷' };
            amount = Math.floor(num(amount)) || 100;
            // v20.53 放贷有额度：钱庄看你家底（现银+存款）放贷，不与陌生人空手套白狼。
            // 此前无上限——借入即存入、月底取出还本，是零风险的空转套利。
            var cap = Math.max(200, Math.floor((stonesNow() + b.deposit) * 2));
            if (amount > cap) {
                return { error: '钱庄掌柜翻着账簿摇头："你这身家，柜上最多放 ' + cap + ' 灵石。"' };
            }
            var r = payStones(amount); // 正数=进账：借入是钱进你口袋
            if (!r || !r.success) return { error: '放款未成' };
            b.debt = amount;
            b.debtDue = day() + LOAN_TERM;
            log('你按下手印领了 ' + amount + ' 灵石。欠条写死：' + LOAN_TERM + ' 日后连本带息还 ' + Math.round(amount * (1 + LOAN_RATE)) +
                ' 灵石，提前还清也按整月计息——欠条是会走路的东西，逾期它自己会找到你门上。', 'warning');
            return { success: true, messages: ['借贷 ' + amount + ' 灵石，' + LOAN_TERM + ' 日后应还 ' + Math.round(amount * (1 + LOAN_RATE))] };
        },

        // v20.53 还账口径：欠条写死借一还二成息，提前还清也按整月计息。
        // 旧版"提前还只还本金"配上存款月息五，借入即存入即是无风险套利。
        repay: function () {
            var ban = banGate();
            if (ban) return ban;
            var b = ledger();
            if (!b) return { error: '钱庄不与无名氏打交道' };
            if (b.debt <= 0) return { error: '你并无欠款' };
            var due = Math.round(b.debt * (1 + LOAN_RATE));
            if (stonesNow() < due) return { error: '还清需 ' + due + ' 灵石（含息），手头不足' };
            var r = payStones(-due); // 负数=支出：还账是钱出你口袋
            if (!r || !r.success) return { error: '交割未成' };
            b.debt = 0;
            b.debtDue = 0;
            log('你当面点清 ' + due + ' 灵石（含息），掌柜抽出欠条，就烛焚了。', 'success');
            return { success: true, messages: ['还清 ' + due + ' 灵石（含息），欠条焚毁'] };
        },

        // v25.8 黑道批：柜娘私烧欠条（npc-crime.js 勒索得手时的正门）——钱庄账面上她自己抹平，
        // 本方法只管销账，业障与民愤热度由调用方那本黑道账记。
        waiveDebt: function (why) {
            var b = ledger();
            if (!b) return { error: '钱庄不与无名氏打交道' };
            if (b.debt <= 0) return { error: '你并无欠款' };
            var waived = Math.round(b.debt * (1 + LOAN_RATE));
            b.debt = 0;
            b.debtDue = 0;
            log('一张欠条就着烛火烧了——' + (why || '柜上销了这笔账') + '。连本带息 ' + waived + ' 灵石，账面上再无你的名字。', 'warning');
            return { success: true, waived: waived, messages: ['欠条焚毁，连本带息 ' + waived + ' 灵石一笔勾销'] };
        },

        // ============ v27.1 放印子钱：你做放贷的那一头，钱庄居中作保 ============
        // 明账：一月期、二成息；十之八九如约，十之一五求宽限，余下卷铺盖跑路——
        // 跑路的柜上追债人追十五日，六成追回本金（息没了），四成坏账（放贷的风险，签字那天就写在小字里）。
        lendOut: function (amount) {
            var ban = banGate();
            if (ban) return ban;
            var b = ledger();
            if (!b) return { error: '钱庄不与无名氏打交道' };
            if (b.debt > 0) return { error: '你自己还欠着柜上的欠条没销——钱庄不替欠债的人作保放款。' };
            var active = 0;
            b.loansOut.forEach(function (l) { if (l.state === 'active') active++; });
            if (active >= LEND_MAX_ACTIVE) return { error: '在外的欠条已有 ' + active + ' 张——柜上作保不过 ' + LEND_MAX_ACTIVE + ' 张，收了旧的再放新的。' };
            amount = Math.floor(num(amount));
            if (amount < LEND_MIN) return { error: '不足 ' + LEND_MIN + ' 灵石——这点钱，柜上懒得立欠条。' };
            if (amount > LEND_MAX_EACH) return { error: '单笔至多 ' + LEND_MAX_EACH + ' 灵石——大额要抵押，柜上不替你抵押。' };
            if (stonesNow() < amount) return { error: '手头灵石不足' };
            var r = payStones(-amount);
            if (!r || !r.success) return { error: '放款未成' };
            b.loansOut.push({ amount: amount, outDay: day(), dueDay: day() + LEND_TERM, state: 'active', lateCount: 0, chaseUntil: 0 });
            log('💸 你经钱庄放出去 ' + amount + ' 灵石。借主是柜上的熟客，欠条写死：' + LEND_TERM + ' 日后连本带息还 ' + Math.round(amount * (1 + LEND_RATE)) + ' 灵石。掌柜压低声音：「十之八九如约；也有苦求宽限的——至于卷铺盖跑路的，柜上追债人自会出门，追不追得回，那是另一本账。」', 'info');
            return { success: true, messages: ['放出 ' + amount + ' 灵石，' + LEND_TERM + ' 日后应收 ' + Math.round(amount * (1 + LEND_RATE)) + '（含息）'] };
        },

        // 放贷到期账：每逢新日一轮——如约/宽限/跑路/追回/坏账，全按明账骰
        checkLoansOut: function () {
            var b = ledger();
            if (!b || !b.loansOut.length) return null;
            var settledAny = false;
            for (var i = b.loansOut.length - 1; i >= 0; i--) {
                var l = b.loansOut[i];
                if (l.state === 'active') {
                    if (day() < l.dueDay) continue;
                    var roll = Math.random();
                    if (roll < LEND_REPAY_P) {
                        var due = Math.round(l.amount * (1 + LEND_RATE));
                        var pr = payStones(due);
                        if (pr && pr.success) {
                            log('🧾 欠条自己走回了家：借主把 ' + due + ' 灵石连本带息送上柜来，冲你拱手作别。（放印子钱，赚的是行情的钱，担的是人心的险）', 'success');
                            b.loansOut.splice(i, 1);
                            settledAny = true;
                        }
                    } else if (roll < LEND_REPAY_P + LEND_LATE_P) {
                        l.dueDay = day() + 10;
                        l.lateCount += 1;
                        log('🧾 借主红着脸来求：「再宽限十日，十日一定还清。」掌柜看你——欠条是你的名，宽不宽你点头。（账照旧，十日后再结）', 'info');
                    } else {
                        l.state = 'chase';
                        l.chaseUntil = day() + LEND_CHASE_DAYS;
                        log('🧾 到期日人去屋空——借主卷铺盖跑了！钱庄追债人已经出门（十五日内见分晓）。掌柜摊手：「追回算你的本金，追不回，这笔就销在你账上。」', 'warning');
                    }
                } else if (l.state === 'chase') {
                    if (day() < l.chaseUntil) continue;
                    if (Math.random() < LEND_CHASE_BACK_P) {
                        var pr2 = payStones(l.amount);
                        if (pr2 && pr2.success) log('🧾 追债人把借主拎了回来——本金 ' + l.amount + ' 灵石如数追回，利息是一个子儿也没有了。这张欠条到此为止。', 'info');
                    } else {
                        log('🧾 追债人追了十五日，空手而回——借主没了影。' + l.amount + ' 灵石成了坏账，钱庄把这笔账销了。放印子钱的风险，你算是尝了个全套。', 'danger');
                        try { if (global.playerPushDeed) global.playerPushDeed('bad', '你在钱庄吃了一张坏账——茶棚里有人拿这事下酒'); } catch (eDeed) {}
                    }
                    b.loansOut.splice(i, 1);
                    settledAny = true;
                }
            }
            return settledAny ? { settled: true } : null;
        },

        // 柜台话术（情境弹窗共用，账目如实播报）
        describe: function () {
            var s = BankService.summary();
            var t = '钱庄掌柜热情招呼："客官存灵石月息五、随存随取，抵押公道，借贷也便。手有余钱的，柜上也居中说合放贷——月息二分，十之八九如约。"';
            if (!s) return t;
            if (s.deposit > 0) t += '\n\n你在柜上的存款：' + s.deposit + ' 灵石' + (s.interest > 0 ? '（已生息 ' + s.interest + '）' : '（未满一月，尚未生息）') + '。';
            if (s.debt > 0) t += s.overdue
                ? '\n掌柜压低声音："阁下的欠条已经逾期——今日不清，改日账房亲自登门。"'
                : '\n掌柜压低声音："欠柜上 ' + s.debt + ' 灵石，' + Math.max(0, s.debtDue - day()) + ' 日后到期。欠条会走路。"';
            // v27.1 放出去的印子钱也如实上牌面
            if (s.outActive > 0 || s.outChase > 0) {
                t += '\n\n你放出去的欠条：在外 ' + s.outActive + ' 张（本金 ' + s.outPrincipal + ' 灵石' + (s.outChase > 0 ? '，另有 ' + s.outChase + ' 张跑了路、追债人在外头追着' : '') + '）。到期它自己会走回柜上来。';
            }
            return t;
        },

        // 逾期催收：每逢新日一笔，有钱划扣、没钱划光+恶名+伤，账不清不止
        checkOverdue: function () {
            var b = ledger();
            if (!b || b.debt <= 0 || day() <= b.debtDue) return null;
            if (b.lastCol === day()) return null;   // 同日至多一轮（新日订阅与柜台碰面共用，不重复抄家）
            var owe = Math.round(b.debt * (1 + LOAN_RATE));
            var cash = stonesNow();
            if (cash >= owe) {
                var r = payStones(-owe, { noto: 1 });
                if (r && r.success) {
                    b.debt = 0; b.debtDue = 0; b.lastCol = day();
                    log('钱庄账房登门：欠条逾期，当场从你袖中划走 ' + owe + ' 灵石，欠条当街撕了。逾期名声传出去，人人多看你一眼。', 'warning');
                    return { settled: true };
                }
            }
            // 划不光：能划多少划多少，剩下的改日再来
            b.lastCol = day();
            var taken = 0;
            if (cash > 0) {
                var rr = payStones(-cash);
                if (rr && rr.success) taken = cash;
            }
            if (global.RewardService) global.RewardService.apply({ noto: 2 }, { source: 'bank' });
            var p = char();
            if (p) {
                p.qi = Math.max(0, num(p.qi) - 20);
                p.health = Math.max(1, num(p.health ?? 1) - 15);
            }
            log('讨债的堵在门口：你' + (taken > 0 ? '被划走身上全部 ' + taken + ' 灵石' : '身无分文') +
                '，挨了推搡伤了元气（真气-20，伤-15）。欠款仍记在账上，明日他们还会来。', 'danger');
            return { settled: false, taken: taken };
        },

        _wired: false,
        wire: function () {
            if (BankService._wired) return;
            BankService._wired = true;
            if (global.timeSystem && typeof global.timeSystem.onNewDaySubscribe === 'function') {
                global.timeSystem.onNewDaySubscribe(function () { BankService.checkOverdue(); BankService.checkLoansOut(); });
            }
        }
    };

    global.BankService = BankService;
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { BankService.wire(); });
        } else {
            BankService.wire();
        }
    }
})(typeof window !== 'undefined' ? window : this);
