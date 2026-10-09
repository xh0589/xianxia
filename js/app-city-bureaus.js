// v27.13 W-1 拆分：自 app.js 迁出 四衙公共设施族（原 :11325-11570 函数本体、:11735-11747 window 导出块）——零逻辑改动，案底见 app.js 原位

// === 户籍司 ===（v20.21 与七衙门同一规矩：书吏翻档要 10 真气打点的茶钱，不再是白拿历练的窗口）
// v21.3 户籍司做厚：翻档/协查浮修/代写户状三块公务牌入情境引擎（原「10 真气翻流寓录」保留为选项一）
function openHouseholdRegistry() {
    if (window.openFacilityScenario) window.openFacilityScenario('household_registry');
    else if (window.showMessage) window.showMessage('户籍司公务剧本未加载。', 'warning');
}

// === 消防司 ===
// v20.48 消防司做实：此前是纯台词死按钮。开门两件事——当差（真气换功德与本城声望，体力不济如实拒绝）
// 与检视火情（今日是否走水，走水时可出力扑救，救成有赏、烧伤挂彩）。
function openFireDepartment() {
    var log = window.gameLog || { add: function() {} };
    var player = window.currentCharData || {};
    var city = (typeof getCurrentCityName === 'function') ? getCurrentCityName() : (window.currentLocation || '');
    var day = (window.timeSystem && window.timeSystem.gameTime) ? (window.timeSystem.gameTime.currentDay || 0) : 0;
    // 走水判定：真源只有日子与城名， seeded——同一城同一天结果一致，不靠当场掷骰说谎
    var seed = (function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; })(String(city) + '_' + day);
    var onFire = (seed % 100) < 12;
    var _addRep = function (n) {
        try {
            if (typeof window.addReputation === 'function' && city) window.addReputation(city, n);
        } catch (e) {}
    };

    var html = '<p class="text-sm text-gray-300 mb-2">消防司值房——水龙、火钩、沙袋靠墙码着，值班差官正在点名。</p>';
    if (onFire) {
        html += '<p class="text-sm text-red-300 mb-3">🔥 今日城中走了水——' + (city || '本城') + '某处起了火，正等着人手！</p>';
        html += '<button onclick="window._fireDeptAct(\'fight\')" class="w-full bg-red-800 hover:bg-red-700 text-white p-3 rounded text-left mb-2">' +
            '🚒 出力扑救——烧 20 真气，救成得赏钱与本城声望，力竭或失手会挂彩</button>';
    } else {
        html += '<p class="text-sm text-gray-400 mb-3">今日并无火情。</p>';
    }
    html += '<button onclick="window._fireDeptAct(\'duty\')" class="w-full bg-amber-800 hover:bg-amber-700 text-white p-3 rounded text-left mb-2">' +
        '🪣 水龙当差半日——烧 10 真气，练扛水龙的本事，功德+1、本城声望+2</button>';
    html += '<button onclick="window._fireDeptAct(\'chat\')" class="w-full bg-gray-700 hover:bg-gray-600 text-white p-3 rounded text-left">' +
        '💬 与差官闲聊城中防火事宜</button>';
    if (typeof window.showBuildingEffectDialog === 'function') {
        window.showBuildingEffectDialog('消防司', html);
    } else if (window.showMessage) {
        window.showMessage(onFire ? '消防司：今日走了水！' : '消防司：今日并无火情。', onFire ? 'warning' : 'info');
    }
}

window._fireDeptAct = function (mode) {
    var log = window.gameLog || { add: function (m, t) { if (window.showMessage) window.showMessage(m, t || 'info'); } };
    var player = window.currentCharData || {};
    var city = (typeof getCurrentCityName === 'function') ? getCurrentCityName() : (window.currentLocation || '');
    var _deductQi = function (n) {
        if (!player || (player.qi || 0) < n) return false;
        player.qi = (player.qi || 0) - n;
        return true;
    };
    var _addRep = function (n) {
        try { if (typeof window.addReputation === 'function' && city) window.addReputation(city, n); } catch (e) {}
    };
    var _pay = function (n) {
        try {
            if (window.XianXia && window.XianXia.DataManager) { window.XianXia.DataManager.addSpiritStones(n); return; }
            if (window.inventory && window.inventory.currency) {
                window.inventory.currency.spiritStones = (window.inventory.currency.spiritStones || 0) + n;
                if (window.currentCharData) window.currentCharData.spiritStones = window.inventory.currency.spiritStones;
            }
        } catch (e) { console.warn('[静默失败] js/app.js:10234 · _fireDeptAct._pay：火政司的灵石账没动——钱包与角色档分文未变，领了个空', e && e && e.message); }
    };
    // DES-48：本页两笔账都走统一通道，而通道会夹逼（业障 ±100、城市声望 0~10000），
    // 照抄开价就在触顶时多印一截——名目沿用本页原有的「功德」「本城声望」，
    // 通道那句「业障」叫法属 DES-38 未裁决的半个文案取舍，此处不改名只改数。
    var _karmaOf = function () {
        var p = window.currentCharData;
        return (p && typeof p.karma === 'number' && isFinite(p.karma)) ? p.karma : null;
    };
    var _repOf = function () {
        if (!city || typeof window.getReputationValue !== 'function') return null;
        var v = Number(window.getReputationValue(city));
        return isFinite(v) ? v : null;
    };
    var _gainWord = function (label, want, before, after) {
        if (before === null || after === null) return label + (want > 0 ? '+' : '') + want;
        var got = after - before;
        if (got === want) return label + (want > 0 ? '+' : '') + want;
        return label + (want > 0 ? '已达上限，实得+' : '已见底，实得') + got;
    };
    // 认返回值：通道说没落账就是不落账（缺角色时整笔不写），别接着演奖励。
    var _settleLedger = function (spec, source) {
        var karma0 = _karmaOf(), rep0 = _repOf(), res = null;
        try {
            if (window.RewardService && typeof window.RewardService.apply === 'function') {
                res = window.RewardService.apply(spec, { source: source, city: city });
            }
        } catch (e) { res = null; }
        if (!res || res.success !== true) return null;
        var parts = [];
        if (spec.karma) parts.push(_gainWord('功德', spec.karma, karma0, _karmaOf()));
        if (spec.rep) {
            // 通道只在认得出城、且 addReputation 在位时才写这一本（reward-service.js:168-176），
            // 而读者与写者同在一个文件里——读不到账就是没写账，此处不许退回照报开价。
            var rep1 = _repOf();
            parts.push(rep1 === null ? '本城声望未入账' : _gainWord('本城声望', spec.rep, rep0, rep1));
        }
        return parts.join('，');
    };
    var dlg = document.getElementById('xianxia-modal-overlay');
    if (dlg && dlg.parentNode) try { dlg.parentNode.removeChild(dlg); } catch (e) {}

    if (mode === 'duty') {
        if (!_deductQi(10)) { log.add('消防司差官摆手：没真气压不住水龙，歇着吧。', 'warning'); return; }
        var dutyGain = _settleLedger({ karma: 1, rep: 2 }, 'fire_duty');
        if (dutyGain) log.add('消防司当差半日：扛水龙、盘水带，肩上磨出印子。' + dutyGain + '。', 'success');
        else log.add('消防司当差半日：扛水龙、盘水带，肩上磨出印子。只是这一笔功德与本城声望没能落账。', 'warning');
        if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(240, '消防司当差');
    } else if (mode === 'fight') {
        if (!_deductQi(20)) { log.add('消防司差官拦住你：真气都提不起来，上火场是添乱。', 'warning'); return; }
        var roll = Math.random();
        if (roll < 0.6) {
            var bounty = 40 + Math.floor(Math.random() * 60);
            _pay(bounty);
            var fightGain = _settleLedger({ karma: 3, rep: 5 }, 'fire_fight');
            log.add('🔥 火场扑救有功！水龙压住火头，官府赏钱 ' + bounty + ' 灵石' + (fightGain ? '，' + fightGain + '。' : '。这一笔功德与本城声望没能落账。'), 'success');
        } else if (roll < 0.85) {
            log.add('🔥 火头太烈，泼出去的水压不住——白烧了真气，人手撤了下来。', 'warning');
        } else {
            player.health = Math.max(1, (player.health ?? 100) - 12);
            log.add('🔥 火场塌了半面墙——你被气浪掀翻，生命-12，被人拖出来。官府给了 10 灵石汤药钱。', 'error');
            _pay(10);
        }
        if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(180, '火场扑救');
    } else {
        log.add('你与消防司差官闲聊几句城中防火事宜，听了几桩旧年大火的教训。', 'info');
        if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(5, '消防司');
    }
    if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus();
    if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
};

// === 悬赏楼 ===（v20.21 接上早就存在却没接线的公共悬赏榜 bounty-board——
// 三栋楼从此各司其职：任务堂挂个人差事，悬赏楼是各家商号与官府的公共赏格，商会做行情与代售）
function openBountyHall() {
    var log = window.gameLog || { add: function() {} };
    log.add('你来到悬赏楼，公共悬赏榜上贴满了各家商号与官府的赏格。', 'info');
    if (typeof window.openBountyBoard === 'function') {
        window.openBountyBoard();
    } else if (typeof openQuestHall === 'function') {
        openQuestHall();
    } else {
        log.add('悬赏榜上暂无新通缉令。', 'info');
    }
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(5, '悬赏楼');
    }
}

// === 税课司 ===（v20.17：看账要耗真气提灯，与工曹署同一规矩，不再是免费历练机）
// v21.3 税课司做厚：查账（读城建真源的行情口径原样保留）/下乡协征/缉查偷漏三块公务牌入情境引擎
function openTaxBureau() {
    if (window.openFacilityScenario) window.openFacilityScenario('tax_bureau');
    else if (window.showMessage) window.showMessage('税课司公务剧本未加载。', 'warning');
}

// === 粮仓 ===（v20.17：扛粮巡查要耗力气，与工曹署同一规矩。v20.22：官价籴米、捐米积德。v20.23：官价随年景行情浮动）
function granaryRiceUnit() { return Math.round(18 * (window.facilityBuyMod ? window.facilityBuyMod() : 1)); }
function granaryBuyRice() {
    var log = window.gameLog || { add: function() {} };
    if (!window.RewardService) { log.add('粮仓账上今日没支应，改日再来。', 'warning'); return false; }
    var cost = granaryRiceUnit() * 3;
    var res = window.RewardService.apply({
        stones: -cost, items: [{ itemId: 'food_spirit_rice', count: 3 }],
        msg: '官价籴米 ' + cost + ' 灵石，扛回三袋灵米饭（今年米价随行市走——官仓到底比坊市厚道三成）。', msgType: 'success'
    }, { source: 'granary', city: (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '' });
    if (!res || res.success === false) { if (window.showMessage) window.showMessage('官价籴米需 ' + cost + ' 灵石，手头不足。', 'warning'); return false; }
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(20, '粮仓籴米');
    return true;
}
function granaryDonateRice() {
    var log = window.gameLog || { add: function() {} };
    if (!window.RewardService) { log.add('粮仓今日不收捐，改日再来。', 'warning'); return false; }
    var res = window.RewardService.apply({
        take: [{ itemId: 'food_spirit_rice', count: 3 }], rep: 4, karma: 2, exp: 2,
        msg: '你把三袋灵米饭捐进粥棚，管事亲手记上功德簿。粥香飘出半条街，你的业障也轻了一分。', msgType: 'success'
    }, { source: 'granary', city: (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '' });
    if (!res || res.success === false) { if (window.showMessage) window.showMessage('行囊里没有三袋灵米饭，捐不成。', 'warning'); return false; }
    log.add('捐米入粥棚：本城声望+4，功德+2（业障-2）。', 'success');
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(15, '粮仓捐米');
    return true;
}
function openGranary() {
    var player = window.currentCharData;
    var log = window.gameLog || { add: function() {} };
    if (!player || (player.qi || 0) < 10) { log.add('粮垛堆得比房高，你真气不济，跟着粮袋挪两步都喘。改日再来吧。', 'warning'); return; }
    player.qi -= 10;
    log.add('你耗了10点真气随管事巡查粮仓，搬垛验潮，一身粮屑。储备充足，收支明白。历练+3。', 'info');
    player.tempering = (player.tempering || 0) + 3;
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(10, '巡视粮仓');
    }
    // v20.22 官价籴米/捐米积德（弹窗里有真价真货，无弹窗维持旧口径）
    if (typeof window.showModal === 'function') {
        window.showModal('🌾 粮仓·官价粜米',
            '<p class="text-xs text-gray-400 mb-2">管事拨着账册："今年官价一袋灵米饭 ' + granaryRiceUnit() + ' 灵石，一次粜三袋共 ' + (granaryRiceUnit() * 3) + '——坊市牌价随年景涨跌，官仓恒让三成。攒够了捐进粥棚，功德簿上见名字。"</p>' +
            '<div style="display:flex;gap:8px"><button onclick="granaryBuyRice()" class="bg-amber-700 hover:bg-amber-600 text-xs px-3 py-2 rounded">🌾 官价籴米 ×3（' + (granaryRiceUnit() * 3) + ' 灵石）</button>' +
            '<button onclick="granaryDonateRice()" class="bg-rose-800 hover:bg-rose-700 text-xs px-3 py-2 rounded">🍚 捐米三袋入粥棚（功德+2）</button></div>');
    }
}

// === 司法堂 ===（v20.18：不只旁听——有概率承接缉查委托，真职能、真气成本）
// v21.3 司法堂做厚：今日堂审按城+日定死（不再当场掷骰变戏法），旁听/承接缉查/帮调解三块公务牌入情境引擎
function openCourt() {
    if (window.openFacilityScenario) window.openFacilityScenario('court');
    else if (window.showMessage) window.showMessage('司法堂公务剧本未加载。', 'warning');
}

// === 镇邪司 ===（v20.17：巡封印要耗真气护航。v20.22：悬赏真收妖丹——官方出溢价收，猎邪就是护城）
function exorcistDonateCore() {
    var log = window.gameLog || { add: function() {} };
    if (!window.RewardService) { log.add('镇邪司今日封印库封档，不收货。', 'warning'); return false; }
    var res = window.RewardService.apply({
        take: [{ itemId: 'mat_demon_beast_core', count: 1 }], stones: 130, exp: 3, karma: 1,
        msg: '你缴上一枚妖兽内丹。镇邪司按悬赏价收——牌价一百，官府给到 130：妖在城外一日，城里人便不安一日，这 30 灵石买的是阖城安稳。', msgType: 'success'
    }, { source: 'exorcist', city: (typeof window.getCurrentCityName === 'function' && window.getCurrentCityName()) || '' });
    if (!res || res.success === false) { if (window.showMessage) window.showMessage('柜上没有内丹，缴不成——丹得自己猎。', 'warning'); return false; }
    log.add('缴丹入库：灵石+130，历练+3，除邪护民功德+1。', 'success');
    if (window.timeSystem && window.timeSystem.advanceTime) window.timeSystem.advanceTime(10, '镇邪司缴丹');
    return true;
}
function openExorcistBureau() {
    var player = window.currentCharData;
    var log = window.gameLog || { add: function() {} };
    if (!player || (player.qi || 0) < 10) { log.add('封印阵纹近身三里便压人神魂，你真气不济，靠近不得。改日再来吧。', 'warning'); return; }
    player.qi -= 10;
    var hasActivity = Math.random() < 0.3;
    if (hasActivity) {
        log.add('你耗了10点真气巡了一圈封印，果不其然：城郊发现疑似邪祟活动的痕迹，你可以前去调查。历练+10。', 'warning');
        player.tempering = (player.tempering || 0) + 10;
    } else {
        log.add('你耗了10点真气巡了一圈封印，今日清静，并无异常事件报告，各处封印一切正常。历练+5。', 'info');
        player.tempering = (player.tempering || 0) + 5;
    }
    if (window.timeSystem && window.timeSystem.advanceTime) {
        window.timeSystem.advanceTime(15, '镇邪司巡查');
    }
    // v20.22 悬赏缴丹台（牌价 100 的妖丹官府 130 收——溢价买的是阖城平安）
    if (typeof window.showModal === 'function') {
        window.showModal('⛩️ 镇邪司·悬赏缴丹',
            '<p class="text-xs text-gray-400 mb-2">主事验丹的铜尺敲在案上："妖兽内丹，牌面一百，官府悬赏价 130 收。城外的妖少一只，城里的灯多点一盏——丹得你猎来，我们不收空口白话。"</p>' +
            '<button onclick="exorcistDonateCore()" class="bg-purple-800 hover:bg-purple-700 text-xs px-3 py-2 rounded">🦴 缴一枚妖兽内丹（+130 灵石，历练+3，功德+1）</button>');
    }
}

// 导出到全局
window.openHouseholdRegistry = openHouseholdRegistry;
window.openFireDepartment = openFireDepartment;
window.openBountyHall = openBountyHall;
window.openTaxBureau = openTaxBureau;
window.openGranary = openGranary;
window.openCourt = openCourt;
window.openExorcistBureau = openExorcistBureau;
window.openMedicalClinic = openMedicalClinic;
// v20.22 四衙真生意（弹窗按钮入口）
window.granaryBuyRice = granaryBuyRice;
window.granaryDonateRice = granaryDonateRice;
window.exorcistDonateCore = exorcistDonateCore;
