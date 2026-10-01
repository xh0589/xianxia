// ==================== 第六十九波 · 商行贩货契（契约所柜台上的跑单帮） ====================
// 押镖送的是别人的货、拿的是死酬金；跑单帮贩的是自己的货、认的是活的行情。
// 契约所是立契的地方——商行在此设柜，贩货单按城+日定死，进出价全认行情真源（PeddlerService）。
// 走 facilityAugment 增补通道（钱庄/当铺/黑市同款先例）：契约所原有两出戏一字不动，这出排后面。
(function () {
    'use strict';
    if (typeof window.facilityAugment !== 'function' || !window.scenarioEngine || !window.PeddlerService) return;

    var PD = window.PeddlerService;

    function cn1(v) { return String(Math.round(Number(v) * 10) / 10); }

    function manifestText() {
        var lines = [];
        var today = PD.todayLots();
        var marks = ['①', '②', '③'];
        for (var i = 0; i < today.length; i++) {
            var t = today[i];
            var s = marks[i] + ' ' + t.name + '（' + t.cat + '）——本城行价 ' + t.price + ' 灵石一担，' + t.note;
            if (t.best) s += '；最俏在' + t.best.region + '（行市 ' + cn1(t.best.mul) + '）';
            lines.push(s + '。');
        }
        return lines.join('\n');
    }

    function shoulderText() {
        var held = PD.holdings();
        if (!held.length) return '肩上：空的——先贩下一担，再谈脚力钱。';
        var marks = ['①', '②', '③'];
        var lines = ['肩上（还剩 ' + held.length + ' 个货位）：'];
        for (var i = 0; i < held.length; i++) {
            var h = held[i];
            var s = marks[i] + ' ' + h.name + '——' + (h.buyCity || '外城') + '进的货' +
                (h.buyDay ? '（第 ' + h.buyDay + ' 天，本价 ' + h.buyPrice + '）' : '（本价 ' + h.buyPrice + '）') +
                '，本城出手价 ' + h.sellPrice;
            s += h.profit > 0 ? '，预计净赚 ' + h.profit + '。'
                : h.profit < 0 ? '，预计折本 ' + (-h.profit) + '。'
                : '，与本价打平。';
            lines.push(s);
        }
        return lines.join('\n');
    }

    function clerkLine() {
        try {
            if (window.CityFaces && typeof window.CityFaces.face === 'function') {
                var f = window.CityFaces.face((window.PeddlerService && window.PeddlerService.city()) || '', 'merchant_clerk');
                if (f) return f.addr;
            }
        } catch (e) {}
        return '掌柜';
    }

    function startDesc() {
        var clerk = clerkLine();
        return '契约所侧厢的商行柜台。跑单帮的贩货契在这儿立：本城行价进货，带去别的地界出手，价差就是脚力的钱——路是自己走的，价是自己认的，赚赔都怨不得旁人。\n' +
            clerk + '把今日贩货单摊开：\n' + manifestText() + '\n' +
            clerk + '又道：「肩上最多挑三担；货出手我柜上按行价打九二折收——同城搬来搬去是白折钱，利在脚力和行情眼。」\n\n' +
            shoulderText();
    }

    window.facilityAugment('contract_hall', {
        id: 'peddler_run', name: '商行贩货契', icon: '🧾',
        desc: '本城行价贩一担货，带去价高地界出手——价差就是脚力的钱',
        startNode: 'pr_start',
        nodes: {
            pr_start: {
                desc: startDesc,
                choices: [
                    { text: '🧾 贩下单上第一担（本城行价现结）', next: null, effects: { peddler: { op: 'buy', idx: 0 }, time: 20 } },
                    { text: '🧾 贩下单上第二担（本城行价现结）', next: null, effects: { peddler: { op: 'buy', idx: 1 }, time: 20 } },
                    { text: '🧾 贩下单上第三担（本城行价现结）', next: null, effects: { peddler: { op: 'buy', idx: 2 }, time: 20 } },
                    { text: '💰 出手肩上第一担（本城行价现结）', next: null, effects: { peddler: { op: 'sell', idx: 0 }, time: 20 } },
                    { text: '💰 出手肩上第二担（本城行价现结）', next: null, effects: { peddler: { op: 'sell', idx: 1 }, time: 20 } },
                    { text: '💰 出手肩上第三担（本城行价现结）', next: null, effects: { peddler: { op: 'sell', idx: 2 }, time: 20 } },
                    { text: '👋 离了柜前', next: null }
                ]
            }
        }
    });

    // v25.6 押货跑商：与上面的跑单帮**分账另立一出**（不改 peddler_run 的柜面选项，
    // 那出是 wave69 钉死的存量戏）。跑单帮是柜面现结的虚拟货担；押货跑商是真把货从行囊扣走
    // 装上肩、看六区行情差价、路上有被截道的风声（caravan-trade.js 正门，剧本层只递话）。
    if (typeof window.openCaravanBoard === 'function') {
        window.facilityAugment('contract_hall', {
            id: 'caravan_run', name: '押货跑商', icon: '🐴',
            desc: '把行囊里的货真装上肩，带去价高地界卸货出手——差价是脚力的钱，路上有失',
            startNode: 'cv_start',
            nodes: {
                cv_start: {
                    desc: function () {
                        return '契约所侧厢的押货柜台。与跑单帮的柜面生意不同：这里押的是你行囊里真真切切的货——\n' +
                            '装上一担，货就从行囊里扣走挂在你肩上；到价高的地界卸回行囊，照当地行市卖给铺子，差价就是脚力的钱。\n' +
                            '⚠️ 货在身上过一天，就有一天被截道的风声——货越贵越招风，仇家也可能亲自来。\n\n' +
                            '柜上摊开的是六区行情板：绿字是该品类最贱的地界（低买），红字是最俏的地界（高卖）。';
                    },
                    choices: [
                        { text: '🐴 看行情板 · 装货上肩 / 卸货入囊', next: null, effects: { caravan: { op: 'open' }, time: 10 } },
                        { text: '👋 离了柜前', next: null }
                    ]
                }
            }
        });
    }
})();
