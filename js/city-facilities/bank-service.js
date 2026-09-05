// js/city-facilities/bank-service.js — 钱庄账房：存款按月起息、欠条到期成真、逾期有人上门
// v20.18：把牌匾上写过的话全部做实。银钱一律走统一结算事务（RewardService→EconomyTransaction），
// 本模块只管账本（_bank 字段，随存档白名单成对往返）与新日催收钩子。
(function (global) {
    'use strict';

    var MONTH_DAYS = 30;          // 一游戏月 30 日
    var DEPOSIT_RATE = 0.05;      // 存月息五
    var LOAN_RATE = 0.2;          // 借一还二成息（借100一月后还120）
    var LOAN_TERM = 30;           // 借期一月

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
        return b;
    }
    function log(m, t) { (global.gameLog || { add: function () {} }).add(m, t || 'info'); }

    var BankService = {
        // 只读口径（面板/情境文案共用）
        summary: function () {
            var b = ledger();
            if (!b) return null;
            var months = b.deposit > 0 ? Math.floor(Math.max(0, day() - b.depStart) / MONTH_DAYS) : 0;
            var interest = Math.round(b.deposit * DEPOSIT_RATE * months);
            return {
                deposit: b.deposit, depStart: b.depStart, debt: b.debt, debtDue: b.debtDue,
                months: months, interest: interest,
                owed: b.debt > 0 ? Math.round(b.debt * (1 + LOAN_RATE)) : 0,
                overdue: b.debt > 0 && day() > b.debtDue
            };
        },

        deposit: function (amount) {
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

        // 柜台话术（情境弹窗共用，账目如实播报）
        describe: function () {
            var s = BankService.summary();
            var t = '钱庄掌柜热情招呼："客官存灵石月息五、随存随取，抵押公道，借贷也便。"';
            if (!s) return t;
            if (s.deposit > 0) t += '\n\n你在柜上的存款：' + s.deposit + ' 灵石' + (s.interest > 0 ? '（已生息 ' + s.interest + '）' : '（未满一月，尚未生息）') + '。';
            if (s.debt > 0) t += s.overdue
                ? '\n掌柜压低声音："阁下的欠条已经逾期——今日不清，改日账房亲自登门。"'
                : '\n掌柜压低声音："欠柜上 ' + s.debt + ' 灵石，' + Math.max(0, s.debtDue - day()) + ' 日后到期。欠条会走路。"';
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
                p.health = Math.max(1, num(p.health || 1) - 15);
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
                global.timeSystem.onNewDaySubscribe(function () { BankService.checkOverdue(); });
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
