// ==================== sect-visit.js - 门派访问系统（P0-三层访问体系） ====================
// 依赖：sects.js（SECT_FACILITY_ACCESS）、sects-system.js（discipleState）
// 功能：山门场景、外院游览、内院封锁、游客/弟子视图切换

// ============ 公告栏数据 ============
const SECT_BULLETIN = [
    { type: 'notice', icon: '📢', text: '欢迎光临本派，外院免费开放，内院弟子区域请止步。' },
    { type: 'rule', icon: '📜', text: '门派重地，非请勿入。擅闯内院者，后果自负。' },
    { type: 'info', icon: 'ℹ️', text: '本派长期招收弟子，有意者可至山门登记。' },
    { type: 'tip', icon: '💡', text: '门派坊市出售各类物品，游客价格略高。' }
];

// 公告栏内容（按门派类型附加额外信息）
function getSectBulletins(sectType) {
    var bulletins = SECT_BULLETIN.slice();
    if (sectType === '正道') {
        bulletins.push({ type: 'notice', icon: '🕊️', text: '正道同气连枝，本派与各正道门派世代交好。' });
    } else if (sectType === '邪派') {
        bulletins.push({ type: 'warning', icon: '⚠️', text: '擅闯禁地者，格杀勿论！' });
    } else {
        bulletins.push({ type: 'info', icon: '🤝', text: '本派保持中立，欢迎各方来客。' });
    }
    return bulletins;
}

// ============ 山门守卫对话 ============
function getGateGuardDialogue(sectName, sect) {
    if (!sect) return '守卫面无表情地看着你。';
    var type = sect.type || '中立';
    // 方案一二：守卫嘴里的称呼跟着门派眼下的地位走
    try { if (typeof window.sectAlignLabel === 'function') { var al = window.sectAlignLabel(sectName); if (al === '正道所认' || al === '活菩萨') type = '正道'; else if (al === '江湖目之为邪' || al === '正道公敌') type = '邪派'; } } catch (eAl) {}
    var power = sect.power || '未知';
    try { if (typeof window.sectPowerNow === 'function') { var pn = window.sectPowerNow(sectName); if (pn) power = pn.tier; } } catch (ePw) {}
    
    // 大隐阁/天书阁无守卫
    if (sectName === '大隐阁' || sectName === '天书阁') {
        return '门庭前空无一人';
    }
    
    var dialogues = {
        '正道': [
            '"道友请留步，前方乃【' + sectName + '】山门。"',
            '"外院向善信开放，可随意参观。"',
            '"内院乃弟子清修之地，请勿擅入。"',
            '"若有意皈依我派，可至山门登记。"'
        ],
        '邪派': [
            '"来者何人！此乃【' + sectName + '】地界。"',
            '"规矩很简单：不该去的地方别去，不该问的别问。"',
            '"想加入？先证明你有这个实力。"',
            '"哼，又是一个不知天高地厚的家伙。"'
        ],
        '中立': [
            '"欢迎来到【' + sectName + '】。"',
            '"外院自由通行，内有坊市可供交易。"',
            '"内院弟子区域，闲人免进。"',
            '"若想加入本派，可先了解门派规矩。"'
        ]
    };
    
    var lines = dialogues[type] || dialogues['中立'];
    return lines[Math.floor(Math.random() * lines.length)];
}

// ============ 渲染公告栏 ============
function renderBulletinBoard(bulletins) {
    if (!bulletins || bulletins.length === 0) {
        return '<p class="text-gray-500 text-sm">暂无公告</p>';
    }
    return bulletins.map(function(b) {
        return '<div class="bg-gray-800/30 p-2 rounded border border-gray-700 flex items-start gap-2">' +
            '<span>' + (b.icon || '📌') + '</span>' +
            '<p class="text-xs text-gray-300">' + b.text + '</p>' +
            '</div>';
    }).join('');
}

// ============ 渲染外院设施 ============
function renderSectOuterFacilities(sectName, isMember, accessLevel) {
    var facilities = window.SECT_FACILITY_ACCESS || {};
    var ids = Object.keys(facilities);
    var html = '';
    
    ids.forEach(function(fid) {
        var f = facilities[fid];
        // 游客只能看到公共设施
        if (!isMember && f.minAccess > 0) return;
        // 权限不足
        if (isMember && f.minAccess > accessLevel) return;
        
        var isLocked = !isMember && f.minAccess > 0;
        var borderClass = isLocked ? 'border-gray-700 opacity-60' : 'border-green-700';
        var areaLabel = f.area === 'outer' ? '外院' : (f.area === 'core' ? '核心' : '内院');
        var areaColor = f.area === 'outer' ? 'text-blue-400' : (f.area === 'core' ? 'text-red-400' : 'text-yellow-400');
        
        html += '<div class="bg-gray-800/50 p-3 rounded border ' + borderClass + '">' +
            '<div class="flex items-center gap-2 mb-1">' +
            '<span class="text-lg">' + (f.icon || '🏛️') + '</span>' +
            '<div class="flex-1">' +
            '<p class="font-bold text-sm text-white">' + f.name + '</p>' +
            '<p class="text-xs text-gray-400">' + f.desc + '</p>' +
            '</div>' +
            '<span class="text-xs ' + areaColor + '">[' + areaLabel + ']</span>' +
            '</div>' +
            (isLocked
                ? '<p class="text-xs text-red-400 mt-1">🔒 需加入门派</p>'
                : (fid === 'sect_market'
                    ? '<button onclick="openSectMarket(\'' + sectName + '\', ' + isMember + ')" class="mt-1 bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">进入坊市</button>'
                    : fid === 'sect_public_task'
                    ? (isMember
                        ? '<button onclick="openSectTaskUI(\'' + sectName + '\', ' + isMember + ')" class="mt-1 bg-green-600 hover:bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">查看任务</button>'
                        : '<span class="text-xs text-red-400 mt-1">🔒 入派后可领公共任务</span>')
                        : fid === 'sect_bulletin'
                            ? '<button onclick="showSectBulletinDialog(\'' + sectName + '\')" class="mt-1 bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">查看公告</button>'
                            : '<button onclick="(window.openSectRoom ? window.openSectRoom(\'' + fid + '\') : useFacility(\'' + fid + '\'))" class="mt-1 bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">' + (window.sectFacilityActionLabel ? window.sectFacilityActionLabel(fid) : '前往') + '</button>')) +
            '</div>';
    });
    
    if (!html) {
        html = '<p class="text-gray-500 text-sm col-span-full">暂无可用设施</p>';
    }
    return html;
}

// ============ 显示公告弹窗 ============
function showSectBulletinDialog(sectName) {
    var sect = window.sectsData?.[sectName];
    var bulletins = getSectBulletins(sect?.type);

    // v23.2 公告栏照进世界（旧版四行静态文本，从不反映任何真实状态）：
    // 掌门行止、本门大事、你自己的职分贡献——都上墙
    var liveLines = [];
    try {
        if (typeof window.isLeaderAway === 'function' && window.isLeaderAway(sectName)) {
            var _awayCity = (typeof window.leaderAwayCity === 'function') ? window.leaderAwayCity(sectName) : '';
            liveLines.push('👑 掌门下山游历' + (_awayCity ? '（闻说行止在' + _awayCity + '一带）' : '') + '，门中事务暂由值守长老代理。');
        }
        var _dsB = window.discipleState || {};
        if (_dsB.isInSect && _dsB.sectId === sectName) {
            liveLines.push('📌 你的职分：' + (_dsB.rankName || '外门弟子') + ' · 在册贡献 ' + (_dsB.contribution || 0) + ' 点。');
        }
        if (window.SectCrisisEngine && typeof window.SectCrisisEngine.listForSect === 'function') {
            var _crises = window.SectCrisisEngine.listForSect(sectName) || [];
            for (var _ci = 0; _ci < _crises.length && _ci < 2; _ci++) {
                if (_crises[_ci] && _crises[_ci].title) liveLines.push('⚠️ 门中近日有异：「' + _crises[_ci].title + '」——内院有详请。');
            }
        }
        // 改造批 · 公告栏一板看全：编年近事 / 外务榜 / 节令
        try {
            var _dsC = window.discipleState || {};
            if (_dsC.isInSect && (_dsC.sectName || _dsC.sectId) === sectName) {
                var _itC = (window.SectGov && window.SectGov.internalRef) ? window.SectGov.internalRef(sectName) : null;
                if (_itC && _itC.chronicle && _itC.chronicle.length) {
                    var _ch = _itC.chronicle.slice(-2).reverse();
                    _ch.forEach(function (c) { liveLines.push('📜 门中近事：' + c.text); });
                }
                if (window.SectTrade && window.SectTrade.probe) {
                    var _rt = (window.SectTrade.probe().routes || []).filter(function (r) { return r.state === 'open' && (r.from === sectName || r.to === sectName); })[0];
                    if (_rt) liveLines.push('🐎 商路张榜：' + _rt.from + '→' + _rt.to + '（' + _rt.goods + '），议事厅可接押运。');
                }
                try {
                    var _dayC = (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') ? window.timeSystem.getAbsoluteDay() : 0;
                    if (_dayC) {
                        var _nextS = (Math.floor(_dayC / 90) + 1) * 90, _nextY = (Math.floor(_dayC / 360) + 1) * 360;
                        liveLines.push('🏆 节令：下回小比第' + _nextS + '日，年一大比第' + _nextY + '日；开山大典在每年正中之日。');
                    }
                } catch (eCal) {}
            }
        } catch (e) {}
    } catch (e) {}
    var liveHtml = liveLines.length
        ? '<div class="bg-yellow-900/30 border border-yellow-700/50 rounded p-2 mb-2">' + liveLines.map(function (l) { return '<p class="text-xs text-yellow-200 mb-1">' + l + '</p>'; }).join('') + '</div>'
        : '';

    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

    modal.innerHTML = '' +
        '<div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-lg w-full mx-4">' +
        '<div class="flex justify-between items-center mb-4">' +
        '<h3 class="text-lg font-bold text-yellow-400">📋 ' + sectName + ' 公告栏</h3>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>' +
        '</div>' +
        liveHtml +
        '<div class="space-y-2">' + renderBulletinBoard(bulletins) + '</div>' +
        '</div>';

    document.body.appendChild(modal);
}

// ============ 进入门派坊市 ============
function openSectMarket(sectName, isMember) {
    // 价格倍率：游客高价，弟子低价
    var priceMod = isMember ? 1.0 : 1.5;
    
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    
    var items = [
        { id: 'pill_small_recovery', name: '小还丹', price: 50, icon: '💊' },
        { id: 'mat_iron_ore', name: '精铁矿', price: 30, icon: '⛏️' },
        { id: 'mat_lingzhi', name: '灵芝', price: 80, icon: '🌿' },
        { id: 'spec_spirit_stone', name: '灵石', price: 100, icon: '💎' },
        // v23.0 阵材上架：布阵系统接通后，阵石阵旗得有真实货源（此前物品账上根本没有它们）
        { id: 'fmt_stone_basic', name: '基础阵石', price: 60, icon: '🪨' },
        { id: 'fmt_flag_iron', name: '铁阵旗', price: 60, icon: '🚩' },
        { id: 'fmt_eye_spirit', name: '灵阵眼', price: 120, icon: '👁️' }
    ];
    
    var listHtml = items.map(function(item) {
        var finalPrice = Math.floor(item.price * priceMod);
        return '<div class="bg-gray-800/50 p-2 rounded border border-gray-700 flex justify-between items-center">' +
            '<div>' +
            '<span class="text-sm text-white">' + item.icon + ' ' + item.name + '</span>' +
            '<span class="text-xs text-gray-400 ml-2">' + finalPrice + '灵石</span>' +
            '</div>' +
            '<button onclick="buySectItem(\'' + item.id + '\', ' + finalPrice + ')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">购买</button>' +
            '</div>';
    }).join('');
    
    modal.innerHTML = '' +
        '<div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-md w-full mx-4">' +
        '<div class="flex justify-between items-center mb-4">' +
        '<h3 class="text-lg font-bold text-yellow-400">🏪 ' + sectName + '坊市</h3>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>' +
        '</div>' +
        '<p class="text-xs text-gray-400 mb-3">' + (isMember ? '弟子价' : '游客价（含附加费）') + '</p>' +
        '<div class="space-y-2">' + listHtml + '</div>' +
        '</div>';
    
    document.body.appendChild(modal);
}

// ============ 购买门派坊市物品 ============
function buySectItem(itemId, price) {
    var inventory = window.inventory || { currency: { spiritStones: 0 } };
    var stones = inventory.currency.spiritStones || 0;
    
    if (stones < price) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('灵石不足！需要 ' + price + ' 灵石', 'error');
        } else {
            alert('灵石不足！');
        }
        return;
    }
    
    inventory.currency.spiritStones = stones - price;
    if (typeof window.addItem === 'function') {
        window.addItem(itemId, 1);
    }
    if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI();
    if (typeof window.updateInventoryUI === 'function') window.updateInventoryUI();
    
    if (typeof window.showMessage === 'function') {
        window.showMessage('购买成功！', 'success');
    }
}

// ============ 渲染内院入口 ============
function renderSectInnerGate(sectName, isMember, accessLevel) {
    if (isMember && accessLevel >= 2) {
        // 弟子可进入内院
        return '<div class="bg-gray-800/40 p-3 rounded border border-yellow-600 text-center">' +
            '<p class="text-sm text-yellow-400 font-bold">🚪 内院入口</p>' +
            '<p class="text-xs text-gray-400 mt-1">弟子区域，修炼洞府、藏经阁等设施位于此处</p>' +
            '<button onclick="openFacilityUI()" class="mt-2 bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs font-bold">🧰 使用设施</button>' +
            '</div>';
    } else if (isMember && accessLevel < 2) {
        return '<div class="bg-gray-800/30 p-3 rounded border border-gray-700 text-center opacity-60">' +
            '<p class="text-sm text-gray-400">🚪 内院入口</p>' +
            '<p class="text-xs text-gray-500">你的职位尚不能进入内院核心区域</p>' +
            '</div>';
    } else {
        // v20.46：游客至内院——门闭着就是了，不立"禁止"的牌子。
        // 准入由门禁与测试守住，场面留给叙事。
        return '<div class="bg-gray-800/30 p-3 rounded border border-gray-700 text-center">' +
            '<p class="text-sm text-gray-400">🚪 内院</p>' +
            '<p class="text-xs text-gray-500 mt-1">门闭着。门内传来弟子早课的诵声，有执事弟子在廊下守着。</p>' +
            '</div>';
    }
}

// ============ 山门场景 ============
function showSectGateScene(sectName) {
    // 灭门之后，旧山门只剩废墟（sect-doom 接管场景；复兴后自动恢复）
    try { if (typeof window.sectRuinView === 'function' && window.sectRuinView(sectName)) return; } catch (eRuin) {}
    var sect = window.sectsData?.[sectName];
    if (!sect) return;
    
    var ds = (typeof window.discipleState !== 'undefined') ? window.discipleState : { isInSect: false };
    var isMember = ds.isInSect && ds.sectId === sectName;
    var accessLevel = typeof window.getSectAccessLevel === 'function' ? window.getSectAccessLevel(sectName) : 0;
    
    // v12.3 温蘅线：进入百花谷时概率自动触发个人事件（世界驱动）
    // v22.1 放开到访客：旧代码写死 isMember 才触发——游客站在谷里什么都不发生。
    // 事件资格门禁（结识/好感/前置/终章）在 maybeAutoTriggerPersonalEvent 内部自有校验，不必在门口再设一道派籍闸。
    if (sectName === '百花谷' && typeof window.maybeAutoTriggerBaihuaEvent === 'function') {
        try { window.maybeAutoTriggerBaihuaEvent('sect'); } catch (e) {}
    }
    // v12.3.1 绯泪线回灌：进入修罗宫时概率自动触发个人事件（同上，放开到访客）
    if (sectName === '修罗宫' && typeof window.maybeAutoTriggerFeiLeiEvent === 'function') {
        try { window.maybeAutoTriggerFeiLeiEvent('sect'); } catch (e) {}
    }
    
    // 如果已经是弟子，直接进入内院视图
    if (isMember) {
        showSectInnerView(sectName);
        return;
    }
    
    // 门派 DOM 节点由 location-system 的 ensureSectPanel 统一创建；
    // 本模块只负责渲染山门/外院/内院内容。
    var panel = typeof window.ensureSectPanel === 'function' ? window.ensureSectPanel() : document.getElementById('sect-panel');
    if (!panel) {
        if (window.showMessage) window.showMessage('门派面板容器未就绪', 'error');
        return;
    }
    panel.classList.remove('hidden');
    
    // 山门场景
    var guardDialogue = getGateGuardDialogue(sectName, sect);
    // 方案一二：山门牌面上写的是门派「眼下」的立场与座次，不是开山时贴的标签
    var dynAlign = sect.type || '中立';
    var dynPower = sect.power || '未知';
    try { if (typeof window.sectAlignLabel === 'function') { var _da = window.sectAlignLabel(sectName); if (_da) dynAlign = _da; } } catch (eDa) {}
    try { if (typeof window.sectPowerLabel === 'function') { var _dp = window.sectPowerLabel(sectName); if (_dp) dynPower = _dp; } } catch (eDp) {}
    var alignCls = (dynAlign === '正道所认' || dynAlign === '活菩萨') ? 'bg-green-900 text-green-400'
        : (dynAlign === '江湖目之为邪' || dynAlign === '正道公敌') ? 'bg-red-900 text-red-400'
        : 'bg-yellow-900 text-yellow-400';
    
    panel.innerHTML = '' +
        '<div class="bg-gray-900 rounded-xl border-2 border-yellow-600/50 p-6">' +
        // 头部
        '<div class="flex justify-between items-start mb-4">' +
        '<div>' +
        '<h2 class="text-2xl font-bold text-yellow-400">🏛️ ' + sectName + '</h2>' +
        '<div class="flex gap-2 mt-2 flex-wrap">' +
        '<span class="px-2 py-0.5 rounded text-xs font-bold ' + alignCls + '">' + dynAlign + '</span>' +
        '<span class="text-xs text-gray-400">📍 ' + (sect.location || '未知') + '</span>' +
        '<span class="text-xs text-gray-400">⚔️ ' + dynPower + '</span>' +
        '</div></div>' +
        '<button onclick="closeSectPanel()" class="text-gray-400 hover:text-white text-2xl">&times;</button>' +
        '</div>' +
        // 山门场景描述
        '<div class="bg-gray-800/40 p-4 rounded mb-4 border border-gray-700">' +
        '<p class="text-gray-300 text-sm">' + (sect.desc || '暂无描述') + '</p>' +
        '</div>' +
        // 守卫对话（大隐阁/天书阁无守卫）
        ((sectName === '大隐阁' || sectName === '天书阁')
        ? '<div class="bg-gray-800/60 p-3 rounded mb-4 border-l-4 border-yellow-500">' +
          '<p class="text-sm text-gray-200 italic">门庭前空无一人</p>' +
          '</div>'
        : '<div class="bg-gray-800/60 p-3 rounded mb-4 border-l-4 border-yellow-500">' +
          '<p class="text-xs text-gray-400 mb-1">🚶 山门守卫：</p>' +
          '<p class="text-sm text-gray-200 italic">' + guardDialogue + '</p>' +
          '</div>') +
        // 操作按钮
        '<div class="flex flex-wrap gap-2 mb-4">' +
        '<button onclick="showSectOuterView(\'' + sectName + '\')" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">🚶 通报入内</button>' +
        '<button onclick="startSectJoinFlow(\'' + sectName + '\')" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">📝 申请入门</button>' +
        '<button onclick="showSectBulletinDialog(\'' + sectName + '\')" class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm">📋 查看公告</button>' +
        '<button onclick="closeSectPanel()" class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm">✕ 离开</button>' +
        '</div>' +
        // 门派概况
        '<div class="grid grid-cols-3 gap-2 text-center">' +
        '<div class="bg-gray-800/50 p-2 rounded"><p class="text-xs text-gray-400">立场</p><p class="text-sm text-white font-bold">' + dynAlign + '</p></div>' +
        '<div class="bg-gray-800/50 p-2 rounded"><p class="text-xs text-gray-400">地位</p><p class="text-sm text-white font-bold">' + dynPower + '</p></div>' +
        '<div class="bg-gray-800/50 p-2 rounded"><p class="text-xs text-gray-400">武学</p><p class="text-sm text-white font-bold">' + (sect.weapons || '?') + '</p></div>' +
        '</div></div>';
    
    // 更新地图高亮
    document.querySelectorAll('.map-sect').forEach(function(s) { s.style.opacity = '0.4'; });
    var sectEl = document.querySelector('[data-sect="' + sectName + '"]');
    if (sectEl) sectEl.style.opacity = '1';
}

// ============ 外院视图 ============
function showSectOuterView(sectName) {
    var sect = window.sectsData?.[sectName];
    if (!sect) return;
    
    var ds = (typeof window.discipleState !== 'undefined') ? window.discipleState : { isInSect: false };
    var isMember = ds.isInSect && ds.sectId === sectName;
    var accessLevel = typeof window.getSectAccessLevel === 'function' ? window.getSectAccessLevel(sectName) : 0;
    
    var panel = (typeof window.ensureSectPanel === 'function') ? window.ensureSectPanel() : document.getElementById('sect-panel');   // 第九十五波·NEW-44：唯一建造者兜底，别裸取（本派捷径绕过它=空白页）
    if (!panel) return;
    panel.classList.remove('hidden');
    
    panel.innerHTML = '' +
        '<div class="bg-gray-900 rounded-xl border-2 border-yellow-600/50 p-6">' +
        // 头部
        '<div class="flex justify-between items-start mb-4">' +
        '<div>' +
        '<h2 class="text-2xl font-bold text-yellow-400">🏛️ ' + sectName + ' · 外院</h2>' +
        (isMember ? '<p class="text-xs text-green-400 mt-1">' + ds.rankName + ' · 贡献 ' + (ds.contribution || 0) + '</p>'
                  : '<p class="text-xs text-blue-400 mt-1">🚶 游客模式</p>') +
        '</div>' +
        '<div class="flex gap-2">' +
        '<button onclick="showSectGateScene(\'' + sectName + '\')" class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded">← 返回山门</button>' +
        '<button onclick="closeSectPanel()" class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded">✕ 离开</button>' +
        '</div></div>' +
        // 外院设施列表
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">' +
        renderSectOuterFacilities(sectName, isMember, accessLevel) +
        // v22.1 游客「求见掌门」：应约/侠名/开放日三条通传路，掌门下山时给去向话头
        (typeof window.renderSectLeaderAudience === 'function' ? window.renderSectLeaderAudience(sectName, isMember) : '') +
        // 第三十六波 散修拜山待客：递帖结交情、演武切磋、藏经借抄（游客专属）
        (typeof window.renderSectVisitHospitality === 'function' ? window.renderSectVisitHospitality(sectName, isMember) : '') +
        '</div>' +
        // 内院入口
        renderSectInnerGate(sectName, isMember, accessLevel) +
        // 操作按钮
        '<div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">' +
        (!isMember
            ? '<button onclick="startSectJoinFlow(\'' + sectName + '\')" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">📝 申请入门</button>'
            : '<button onclick="showSectInnerView(\'' + sectName + '\')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs font-bold">🏛️ 进入内院</button>' +
              '<button onclick="leaveSect()" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold">退出门派</button>') +
        '</div></div>';
}

// ============ 内院视图（弟子专属） ============
function showSectInnerView(sectName) {
    var sect = window.sectsData?.[sectName];
    if (!sect) return;
    
    var ds = (typeof window.discipleState !== 'undefined') ? window.discipleState : { isInSect: false };
    var isMember = ds.isInSect && ds.sectId === sectName;
    if (!isMember) {
        showSectOuterView(sectName);
        return;
    }
    
    var panel = (typeof window.ensureSectPanel === 'function') ? window.ensureSectPanel() : document.getElementById('sect-panel');   // 第九十五波·NEW-44：唯一建造者兜底，别裸取（本派捷径绕过它=空白页）
    if (!panel) return;
    panel.classList.remove('hidden');
    
    // 获取内院设施
    var facilities = window.SECT_FACILITY_ACCESS || {};
    var innerIds = Object.keys(facilities).filter(function(fid) {
        return facilities[fid].minAccess >= 2;
    });
    
    var innerHtml = innerIds.map(function(fid) {
        var f = facilities[fid];
        var canUse = (typeof window.canAccessFacility === 'function') ? window.canAccessFacility(fid) : true;
        var borderClass = canUse ? 'border-green-700' : 'border-gray-700 opacity-50';
        
        return '<div class="bg-gray-800/50 p-3 rounded border ' + borderClass + '">' +
            '<div class="flex items-center gap-2">' +
            '<span class="text-xl">' + (f.icon || '🏛️') + '</span>' +
            '<div class="flex-1">' +
            '<p class="font-bold text-sm text-white">' + f.name + '</p>' +
            '<p class="text-xs text-gray-400">' + f.desc + '</p>' +
            '</div>' +
            (canUse
                ? '<button onclick="(window.openSectRoom ? window.openSectRoom(\'' + fid + '\') : useFacility(\'' + fid + '\'))" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-2 py-1 rounded text-xs font-bold">' + (window.sectFacilityActionLabel ? window.sectFacilityActionLabel(fid) : '前往') + '</button>'
                : '<span class="text-xs text-gray-500">权限不足</span>') +
            '</div></div>';
    }).join('');

    // v21.3 本派专属建筑进内院：此前寒潭（修罗宫）、血池（血刀门）这类专属设施
    // 戏都写好了，却只藏在旧「使用设施」弹窗里，内院视图永远列不出来——玩家自然觉得"没深度"
    var extraFacs = (window.SECT_FACILITY_EXTRAS && window.SECT_FACILITY_EXTRAS[sectName]) || [];
    var extraHtml = extraFacs.map(function (f) {
        var acc = (typeof window.checkFacilityAccess === 'function')
            ? window.checkFacilityAccess(f.id) : { accessible: true, reason: '' };
        var xCanUse = !!acc.accessible;
        var xBorder = xCanUse ? 'border-purple-700' : 'border-gray-700 opacity-50';
        return '<div class="bg-gray-800/50 p-3 rounded border ' + xBorder + '">' +
            '<div class="flex items-center gap-2">' +
            '<span class="text-xl">' + (f.icon || '🏛️') + '</span>' +
            '<div class="flex-1">' +
            '<p class="font-bold text-sm text-purple-300">' + f.name + ' <span class="text-[10px] text-purple-500">[本派专属]</span></p>' +
            '<p class="text-xs text-gray-400">' + (f.desc || '') + '</p>' +
            '</div>' +
            (xCanUse
                ? '<button onclick="(window.openSectRoom ? window.openSectRoom(\'' + f.id + '\') : useFacility(\'' + f.id + '\'))" class="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold">' + (window.sectFacilityActionLabel ? window.sectFacilityActionLabel(f.id) : '进入') + '</button>'
                : '<span class="text-xs text-gray-500">' + (acc.reason || '权限不足') + '</span>') +
            '</div></div>';
    }).join('');

    // 改造批 · 门中底子：特色按钮/冷却整套退役——底子永远在身上，靠真实行为练（sect-passives.js）
    var specialtyHtml = (typeof window.sectPassiveCard === 'function') ? (window.sectPassiveCard(sectName) || '') : '';
    // 第十二波 · 开山秘艺：各派看家本事升华为镇派之格的高级功法（藏经阁真线），卡片亮出来
    var sigHtml = '';
    try { if (typeof window.sectSignatureCard === 'function') sigHtml = window.sectSignatureCard(sectName) || ''; } catch (eSig) {}
    // 第十三波 · 门派身份：八派看家本事（血引/识毒济生/街谈网/心火淬火/戒疤面壁/雪魄养心/万卷归一/袖箭淬毒）终于有了正门——
    // 旧特色按钮引擎退役（特色正身已是开山秘艺），但身份技是有代价、有世界反应的活内容，不该跟着按钮一起埋掉
    var identityHtml = '';
    try {
        var _sp = (window.SECT_SPECIALTIES || {})[sectName];
        if (_sp && (typeof _sp.precheck === 'function' || _sp.costText)) {
            var _stText = '';
            try { _stText = (typeof _sp.stateText === 'function') ? (_sp.stateText() || '') : ''; } catch (eSt) {}
            identityHtml = '<div class="bg-gray-800/60 border border-purple-700/50 rounded p-2 mb-3">' +
                '<p class="text-sm text-purple-300 mb-1">' + (_sp.icon || '🎭') + ' ' + _sp.name + '</p>' +
                '<p class="text-xs text-gray-400 mb-1">' + (_sp.desc || '') + '</p>' +
                (_sp.costText ? '<p class="text-xs text-gray-500 mb-1">代价：' + _sp.costText + '</p>' : '') +
                (_stText ? '<p class="text-xs text-cyan-300 mb-1">' + _stText + '</p>' : '') +
                '<button onclick="window.useSectSpecialty(\'' + sectName + '\')" class="bg-purple-800 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded">施展</button></div>';
        }
    } catch (eId) {}
    
    panel.innerHTML = '' +
        '<div class="bg-gray-900 rounded-xl border-2 border-yellow-600/50 p-6">' +
        // 头部
        '<div class="flex justify-between items-start mb-4">' +
        '<div>' +
        '<h2 class="text-2xl font-bold text-yellow-400">🏛️ ' + sectName + ' · 内院</h2>' +
        '<p class="text-xs text-purple-400 mt-1">' + ds.rankName + ' · 贡献 ' + (ds.contribution || 0) + '</p>' +
        '</div>' +
        '<div class="flex gap-2">' +
        '<button onclick="showSectOuterView(\'' + sectName + '\')" class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded">← 外院</button>' +
        '<button onclick="closeSectPanel()" class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded">✕ 离开</button>' +
        '</div></div>' +
        // 门派大事（v20.49 因果引擎：酝酿可防备 / 爆发抉择 / 余波了结）
        (function() {
            try {
                return (window.SectCrisis && typeof window.SectCrisis.display === 'function')
                    ? ((window.SectCrisis.display(sectName) || {}).html || '') : '';
            } catch (eCrisis) { return ''; }
        })() +
        // 门派事件（P3）
        (function() {
            var eventDisplay = (typeof window.getSectEventDisplay === 'function') ? window.getSectEventDisplay(sectName) : null;
            return eventDisplay ? eventDisplay.html : '';
        })() +
        // 门派特色功能
        (specialtyHtml ? '<h3 class="text-lg font-bold text-purple-400 mb-2">🌟 门中底子</h3>' + specialtyHtml : '') +
        // 第十二波 · 开山秘艺（高级功法形态的门派特色）
        (sigHtml ? '<h3 class="text-lg font-bold text-amber-400 mb-2">📜 开山秘艺</h3>' + sigHtml : '') +
        // 第十三波 · 门派身份（八派本事有了正门）
        (identityHtml ? '<h3 class="text-lg font-bold text-purple-400 mb-2">🎭 门派身份</h3>' + identityHtml : '') +
        // 内院设施列表
        '<h3 class="text-lg font-bold text-blue-400 mb-2">🏛️ 内院设施</h3>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">' +
        (innerHtml || '<p class="text-gray-500 text-sm col-span-full">暂无可用设施</p>') +
        '</div>' +
        // v21.3 本派专属建筑（寒潭/血池/达摩洞这类，各自有整出戏）
        (extraHtml ? '<h3 class="text-lg font-bold text-purple-400 mb-2">🌸 本派专属之地</h3>' +
            '<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">' + extraHtml + '</div>' : '') +
        // 弟子状态
        '<div class="grid grid-cols-4 gap-2 mb-4">' +
        '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">职位</p><p class="text-purple-400 font-bold text-sm">' + (ds.rankName || '外门弟子') + '</p></div>' +
        '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">贡献</p><p class="text-green-400 font-bold text-sm">' + (ds.contribution || 0) + '</p></div>' +
        '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">弟子等级</p><p class="text-blue-400 font-bold text-sm">Lv.' + (ds.level || 1) + '</p></div>' +
        '<div class="bg-gray-800 p-2 rounded text-center"><p class="text-xs text-gray-400">完成任务</p><p class="text-white font-bold text-sm">' + (ds.tasksCompleted || 0) + '</p></div>' +
        '</div>' +
        // 门派弟子列表
        (function() {
            var npcs = (typeof window.getSectNPCs === 'function') ? window.getSectNPCs(sectName) : [];
            if (npcs.length === 0) return '';
            var npcHtml = '<h3 class="text-lg font-bold text-green-400 mb-2">👥 门派弟子</h3><div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">';
            npcs.slice(0, 8).forEach(function(n) {
                var icon = n.occupation === '掌门' || n.occupation === '掌门' ? '👑' : (n.occupation === '长老' || n.occupation === '护法' ? '🧓' : '🧑');
                var realmText = (n.combat?.realm || '炼气') + (n.combat?.layer || 1) + '层';
                npcHtml += '<div class="bg-gray-800/40 p-2 rounded border border-gray-700 text-center">' +
                    '<span class="text-lg">' + icon + '</span>' +
                    '<p class="text-xs text-gray-300 truncate font-bold" title="' + n.name + '">' + n.name + '</p>' +
                    '<p class="text-xs text-green-400">' + realmText + '</p>' +
                    '<p class="text-xs text-gray-500">' + (n.occupation || '弟子') + '</p>' +
                    '<button onclick="window.showNPCDialog(\'' + n.id + '\')" class="mt-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded w-full">对话</button>' +
                    '</div>';
            });
            npcHtml += '</div>';
            return npcHtml;
        })() +
        // 快速操作
        '<div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">' +
        '<button onclick="openSectTaskUI()" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs">📋 任务面板</button>' +
        '<button onclick="collectSectResources()" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs">💰 领取俸禄</button>' +
        '<button onclick="window.openSectLifePanel && openSectLifePanel()" class="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs">🏮 门里的日子</button>' +
        '<button onclick="showSectRanks(\'' + sectName + '\')" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs">⬆️ 晋升</button>' +
        (typeof window.hasSectDeepData === 'function' && window.hasSectDeepData(sectName)
            ? '<button onclick="showSectDeepOverview(\'' + sectName + '\')" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs">📖 门派详情</button>'
            : '') +
        '<button onclick="holdSectMeeting(\'' + sectName + '\')" class="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs">🏛️ 会议</button>' +
        '<button onclick="showSectDiplomacy(\'' + sectName + '\')" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs">🤝 外交</button>' +
        '<div class="flex-1"></div>' +
        '<button onclick="leaveSect()" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs">退出门派</button>' +
        '</div></div>';
    
    // v9.9: 日常事件——进入门派内院后尝试触发（延时避免与面板抢焦点）
    if (window.dailyEvents && typeof window.dailyEvents.tryTriggerDailyEvent === 'function') {
        setTimeout(function() {
            try { window.dailyEvents.tryTriggerDailyEvent('sect', { source: 'sect_enter', skipGlobalCd: false }); } catch (e) {}
        }, 500);
    }
}

// ============ 导出 ============
window.SECT_BULLETIN = SECT_BULLETIN;
window.getSectBulletins = getSectBulletins;
window.getGateGuardDialogue = getGateGuardDialogue;
window.renderBulletinBoard = renderBulletinBoard;
window.renderSectOuterFacilities = renderSectOuterFacilities;
window.showSectBulletinDialog = showSectBulletinDialog;
window.openSectMarket = openSectMarket;
window.buySectItem = buySectItem;
window.renderSectInnerGate = renderSectInnerGate;
// ============ v10.0 门派外交系统 ============
// 每个门派都对其他所有门派持有看法，存储在全局 SECT_DIPLOMACY_STATE
var SECT_DIPLOMACY_STATE = {};

function initSectDiplomacy() {
    var saved = localStorage.getItem('xianxia_sect_diplomacy');
    if (saved) {
        try {
            var parsed = JSON.parse(saved);
            Object.keys(SECT_DIPLOMACY_STATE).forEach(function(k) { delete SECT_DIPLOMACY_STATE[k]; });
            Object.assign(SECT_DIPLOMACY_STATE, parsed || {});
            return;
        } catch(e) {}
    }
    // 首次初始化：生成所有门派之间的关系
    var sects = window.sectsData || {};
    var names = Object.keys(sects);
    names.forEach(function(name) {
        if (!SECT_DIPLOMACY_STATE[name]) SECT_DIPLOMACY_STATE[name] = {};
        names.forEach(function(other) {
            if (name === other) return;
            var myType = sects[name].type;
            var otherType = sects[other].type;
            var baseRel = 0;
            // 同类型基础友好
            if (myType === otherType) baseRel = 40 + Math.floor(Math.random() * 30);
            else if ((myType === '正道' && otherType === '邪派') || (myType === '邪派' && otherType === '正道')) baseRel = -40 - Math.floor(Math.random() * 30);
            else baseRel = Math.floor(Math.random() * 20) - 10; // 中立→中立/中立→其他
            SECT_DIPLOMACY_STATE[name][other] = {
                relation: baseRel,        // -100~100
                trade: 0,                  // 贸易次数
                conflicts: 0,              // 冲突次数
                lastEvent: 0,             // 上次事件day
                treaties: []               // 条约列表
            };
        });
    });
    saveSectDiplomacy();
}

function saveSectDiplomacy() {
    try { localStorage.setItem('xianxia_sect_diplomacy', JSON.stringify(SECT_DIPLOMACY_STATE)); } catch(e) {}
}

function getSectRelationLabel(value) {
    if (value >= 80) return { label: '盟友', color: 'text-green-400', icon: '🤝' };
    if (value >= 50) return { label: '友好', color: 'text-blue-400', icon: '👍' };
    if (value >= 20) return { label: '友善', color: 'text-teal-400', icon: '☺️' };
    if (value >= -10) return { label: '中立', color: 'text-gray-400', icon: '😐' };
    if (value >= -40) return { label: '冷淡', color: 'text-yellow-400', icon: '😒' };
    if (value >= -70) return { label: '敌视', color: 'text-orange-400', icon: '⚔️' };
    return { label: '死敌', color: 'text-red-500', icon: '💀' };
}

// ============ 显示外交面板 ============
function showSectDiplomacy(sectName) {
    var sects = window.sectsData || {};
    var diplomacy = SECT_DIPLOMACY_STATE[sectName] || {};
    var myType = sects[sectName] ? sects[sectName].type : '未知';
    // 第十九波：自家山门（自建宗门）——面板不再是只读的，结盟/送礼/兴兵都落掌门自己的真账
    var _inSect = !!(window.discipleState && window.discipleState.isInSect);
    var _isPsHome = false;
    try { _isPsHome = !!(window.PSectWorld && window.PSectWorld.homeName && window.PSectWorld.homeName() === sectName); } catch (ePsH) {}
    
    // 按关系排序
    var entries = Object.keys(diplomacy).map(function(other) {
        var d = diplomacy[other];
        var otherType = sects[other] ? sects[other].type : '未知';
        var relInfo = getSectRelationLabel(d.relation);
        return {
            name: other, type: otherType, relation: d.relation,
            label: relInfo.label, color: relInfo.color, icon: relInfo.icon,
            trade: d.trade || 0, conflicts: d.conflicts || 0,
            allied: (d.treaties || []).indexOf('alliance') >= 0
        };
    }).sort(function(a, b) { return b.relation - a.relation; });
    
    var html = '<div class="space-y-3">';
    html += '<div class="flex justify-between items-center mb-2">';
    html += '<h3 class="text-lg font-bold text-yellow-400">🤝 外交关系 · ' + sectName + '</h3>';
    html += '<span class="text-xs text-gray-400">类型：' + myType + '</span>';
    html += '</div>';
    html += '<p class="text-xs text-gray-400 mb-3">各门派对我派的看法（-100死敌 ~ 100盟友）</p>';
    
    // 按关系程度分组
    var groups = { ally: [], friendly: [], neutral: [], cold: [], hostile: [], enemy: [] };
    entries.forEach(function(e) {
        if (e.relation >= 50) groups.ally.push(e);
        else if (e.relation >= 20) groups.friendly.push(e);
        else if (e.relation >= -10) groups.neutral.push(e);
        else if (e.relation >= -40) groups.cold.push(e);
        else if (e.relation >= -70) groups.hostile.push(e);
        else groups.enemy.push(e);
    });
    
    var groupLabels = {
        ally: { label: '盟友', color: 'text-green-400', icon: '🤝' },
        friendly: { label: '友好', color: 'text-blue-400', icon: '👍' },
        neutral: { label: '中立', color: 'text-gray-400', icon: '😐' },
        cold: { label: '冷淡', color: 'text-yellow-400', icon: '😒' },
        hostile: { label: '敌视', color: 'text-orange-400', icon: '⚔️' },
        enemy: { label: '死敌', color: 'text-red-500', icon: '💀' }
    };
    
    var hasContent = false;
    Object.keys(groups).forEach(function(g) {
        var list = groups[g];
        if (list.length === 0) return;
        hasContent = true;
        var gl = groupLabels[g];
        html += '<div class="mb-2">';
        html += '<p class="text-sm font-bold ' + gl.color + ' mb-1">' + gl.icon + ' ' + gl.label + '（' + list.length + '）</p>';
        html += '<div class="space-y-1">';
        list.forEach(function(e) {
            var barWidth = Math.max(5, Math.abs(e.relation));
            var barColor = e.relation >= 0 ? 'bg-green-600' : 'bg-red-600';
            var typeIcon = e.type === '正道' ? '😇' : (e.type === '邪派' ? '😈' : '😐');
            html += '<div class="bg-gray-800/40 p-2 rounded border border-gray-700">';
            html += '<div class="flex justify-between items-center text-xs">';
            html += '<span class="text-gray-300">' + typeIcon + ' ' + e.name + '</span>';
            html += '<span class="' + e.color + ' font-bold">' + e.label + '（' + e.relation + '）</span>';
            html += '</div>';
            // 关系条
            html += '<div class="w-full h-1.5 bg-gray-700 rounded mt-1 overflow-hidden">';
            html += '<div class="h-full ' + barColor + ' rounded" style="width:' + barWidth + '%;"></div>';
            html += '</div>';
            html += '<div class="flex justify-between text-xs text-gray-500 mt-1">';
            html += '<span>贸易：' + e.trade + '次</span>';
            html += '<span>冲突：' + e.conflicts + '次</span>';
            if (e.relation < 0 && _inSect && !_isPsHome) {
                html += '<button onclick="initiateSectConflict(\'' + sectName + '\', \'' + e.name + '\')" class="text-red-400 hover:text-red-300">⚔️ 征讨</button>';
            }
            if (e.relation >= 20 && _inSect && !_isPsHome) {
                html += '<button onclick="proposeSectAlliance(\'' + sectName + '\', \'' + e.name + '\')" class="text-green-400 hover:text-green-300">🤝 结盟</button>';
            }
            // 第十九波：自家山门的外交——掌门亲手办（钱走宗库真账，战是真仗）
            if (_isPsHome) {
                if (e.allied) {
                    html += '<span class="text-green-400" title="盟书有约：山门有难，来相援">🤝 已盟·来相援</span>';
                } else if (e.relation >= 20) {
                    html += '<button onclick="window.psDiploAlly(\'' + e.name + '\')" class="text-green-400 hover:text-green-300">🤝 结盟（盘缠八十·宗库）</button>';
                }
                if (e.relation <= -40) {
                    html += '<button onclick="window.psDiploWar(\'' + e.name + '\')" class="text-red-400 hover:text-red-300">⚔️ 兴兵</button>';
                }
                if (e.relation < 80) {
                    html += '<button onclick="window.psDiploGift(\'' + e.name + '\')" class="text-amber-300 hover:text-amber-200">🎁 送礼（三十·月一回）</button>';
                }
            }
            html += '</div></div>';
        });
        html += '</div></div>';
    });
    
    if (!hasContent) html += '<p class="text-gray-500 text-sm">暂无外交关系数据</p>';
    
    // 外交事件日志
    html += '<hr class="border-gray-600">';
    html += '<p class="text-sm text-gray-400">💡 外交说明：</p>';
    html += '<ul class="text-xs text-gray-500 space-y-1 list-disc list-inside">';
    html += '<li>同类型门派（正道/邪派/中立）基础关系较高</li>';
    html += '<li>正邪对立门派基础关系为负值</li>';
    html += '<li>通过贸易、协助、结盟可以提升关系</li>';
    html += '<li>关系达到50以上可提议结盟</li>';
    html += '<li>关系低于-40可能触发敌对行动</li>';
    html += '</ul>';
    html += '</div>';
    // 江湖风云册入口（AI 门派之间的恩怨战事，sect-diplomacy-world）
    if (typeof window.openWorldDiplomacy === 'function') {
        html += '<div class="mt-3"><button onclick="window.openWorldDiplomacy()" class="w-full bg-indigo-800 hover:bg-indigo-700 text-xs px-3 py-2 rounded">🌍 江湖风云——别家门派之间的死仇、盟约与近来战事</button></div>';
    }
    window.showModal('门派外交', html);
}

// 发起征讨
function initiateSectConflict(mySect, targetSect) {
    // 第十九波：自家山门没有贡献账可花——掌门兴兵走宿怨门控与真仗（殿议同一口径）
    try {
        if (window.PSBoot && window.PSBoot.isPlayerSect && window.PSBoot.isPlayerSect(mySect)) {
            var we = (window.PSectWorld && window.PSectWorld.warEligible) ? window.PSectWorld.warEligible(mySect, targetSect) : { ok: false, text: '兴兵无名。' };
            if (!we.ok) { if (window.showMessage) window.showMessage(we.text, 'warning'); return; }
            if (window.declareWarForHome) window.declareWarForHome(mySect, targetSect);
            return;
        }
    } catch (ePsW) {}
    // v23.2 征讨不是点一下掉20关系的按钮：兴师动众要贡献开拔，胜负掷出来——
    // 打赢缴获战利（贡献回本有余），打输自己带伤、仇结得更深
    if (!confirm('确定向 ' + targetSect + ' 发起征讨？兴师需 200 贡献开拔，刀兵一开，胜负难料，仇怨必结。')) return;
    var ds = window.discipleState || {};
    if ((ds.contribution || 0) < 200) {
        if (window.showMessage) window.showMessage('兴师动众需 200 贡献开拔（当前 ' + (ds.contribution || 0) + '）——粮草未足，谈何征讨。', 'warning');
        return;
    }
    ds.contribution -= 200;
    if (window.timeSystem && window.timeSystem.advanceTime) { try { window.timeSystem.advanceTime(240, '征讨点兵'); } catch (e) {} }
    var _cWin = Math.random() < 0.55;
    if (SECT_DIPLOMACY_STATE[mySect] && SECT_DIPLOMACY_STATE[mySect][targetSect]) {
        SECT_DIPLOMACY_STATE[mySect][targetSect].relation -= _cWin ? 20 : 30;
        SECT_DIPLOMACY_STATE[mySect][targetSect].conflicts += 1;
    }
    if (SECT_DIPLOMACY_STATE[targetSect] && SECT_DIPLOMACY_STATE[targetSect][mySect]) {
        SECT_DIPLOMACY_STATE[targetSect][mySect].relation -= _cWin ? 20 : 30;
    }
    saveSectDiplomacy();
    if (_cWin) {
        ds.contribution = (ds.contribution || 0) + 320;
        try { window.sectLedgerNote && window.sectLedgerNote(320, '外交出战·旗开得胜'); } catch (e) {}
        if (window.showMessage) window.showMessage('⚔️ 捷报！门下弟子旗开得胜，缴获颇丰——记功 320 贡献。但 ' + targetSect + ' 这个仇算是结死了（关系-20）。', 'success');
    } else {
        if (window.currentCharData) window.currentCharData.health = Math.max(1, (window.currentCharData.health || 100) - 20);
        if (typeof window.updateCharacterStatus === 'function') { try { window.updateCharacterStatus(); } catch (e2) {} }
        if (window.showMessage) window.showMessage('💔 征讨失利，弟子们带伤而回，你也在乱战中挂了彩（健康-20）。' + targetSect + ' 气焰更盛，仇怨加深（关系-30）。', 'error');
    }
    showSectDiplomacy(mySect);
}

// 提议结盟
function proposeSectAlliance(mySect, targetSect) {
    // 第十九波：自家山门的盟约——盘缠走宗库真账（掌门没有贡献账）
    try {
        if (window.PSBoot && window.PSBoot.isPlayerSect && window.PSBoot.isPlayerSect(mySect)) {
            if (window.psDiploAlly) window.psDiploAlly(targetSect);
            return;
        }
    } catch (ePsA) {}
    // v23.2 结盟有成败：使者要盘缠，成否看平日交情——旧版提议必成、白加15关系，外交成了加点按钮
    if (!confirm('确定向 ' + targetSect + ' 提议结盟？使者盘缠需 100 贡献，成与不成，看两家平日交情。')) return;
    var dsA = window.discipleState || {};
    if ((dsA.contribution || 0) < 100) {
        if (window.showMessage) window.showMessage('使者盘缠需 100 贡献（当前 ' + (dsA.contribution || 0) + '）——无礼无以言盟。', 'warning');
        return;
    }
    dsA.contribution -= 100;
    if (window.timeSystem && window.timeSystem.advanceTime) { try { window.timeSystem.advanceTime(120, '遣使议盟'); } catch (e) {} }
    var _rel = (SECT_DIPLOMACY_STATE[mySect] && SECT_DIPLOMACY_STATE[mySect][targetSect] && SECT_DIPLOMACY_STATE[mySect][targetSect].relation) || 0;
    var _aChance = Math.min(0.9, Math.max(0.15, 0.5 + _rel / 200));
    var _aOk = Math.random() < _aChance;
    if (SECT_DIPLOMACY_STATE[mySect] && SECT_DIPLOMACY_STATE[mySect][targetSect]) {
        if (_aOk) {
            SECT_DIPLOMACY_STATE[mySect][targetSect].relation += 15;
            SECT_DIPLOMACY_STATE[mySect][targetSect].treaties.push('alliance');
            if (SECT_DIPLOMACY_STATE[targetSect] && SECT_DIPLOMACY_STATE[targetSect][mySect]) {
                SECT_DIPLOMACY_STATE[targetSect][mySect].relation += 15;
            }
        } else {
            SECT_DIPLOMACY_STATE[mySect][targetSect].relation -= 5;
        }
    }
    saveSectDiplomacy();
    if (window.showMessage) window.showMessage(_aOk
        ? '🤝 使者回禀：' + targetSect + ' 愿与本门结盟，两家互换信物！（关系+15）'
        : '📜 使者空手而回——' + targetSect + ' 婉拒：「时机未到。」（关系-5；平日多走动，成功率更高）', _aOk ? 'success' : 'warning');
    showSectDiplomacy(mySect);
}

window.showSectGateScene = showSectGateScene;
window.showSectOuterView = showSectOuterView;
window.showSectInnerView = showSectInnerView;
window.showSectDiplomacy = showSectDiplomacy;
window.initSectDiplomacy = initSectDiplomacy;
window.initiateSectConflict = initiateSectConflict;
window.proposeSectAlliance = proposeSectAlliance;
window.SECT_DIPLOMACY_STATE = SECT_DIPLOMACY_STATE;

// v12.1：门派外交进入统一模块状态；保持对象引用稳定，避免 window 导出指向旧对象。
if (window.StateRegistry) {
    window.StateRegistry.register('sectDiplomacy', {
        version: 1,
        export: function() { return JSON.parse(JSON.stringify(SECT_DIPLOMACY_STATE)); },
        import: function(data) {
            Object.keys(SECT_DIPLOMACY_STATE).forEach(function(k) { delete SECT_DIPLOMACY_STATE[k]; });
            Object.assign(SECT_DIPLOMACY_STATE, data || {});
            window.SECT_DIPLOMACY_STATE = SECT_DIPLOMACY_STATE;
        },
        reset: function() {
            Object.keys(SECT_DIPLOMACY_STATE).forEach(function(k) { delete SECT_DIPLOMACY_STATE[k]; });
            window.SECT_DIPLOMACY_STATE = SECT_DIPLOMACY_STATE;
        }
    });
}

// ==================== 第三十六波 · 散修拜山三事（外院待客） ====================
// 游客进得了外院，此前却只能看公告、逛坊市、求见掌门——名门当面，连句交情都结不下。
// 三件待客事：递拜山帖（礼金结交情）/ 演武切磋（点到为止，赢彩头）/ 藏经借抄（在册抄费，
// 落 artInsights 掌握度——进运功栏真能出招；六维折算只认本派，不双吃；镇派神功不外传）。
// 交情账记在角色数据 _sectVisit[宗门名]（一人一本、随存档走）——
// 与 SECT_DIPLOMACY_STATE 两不相干：那是宗门与宗门之间的脸面，这是你个人的交情。
var SECT_VISIT_CFG = {
    GIFT_COST: 20,          // 拜山帖礼金
    SPAR_ENERGY: 10,        // 切磋耗精力（竞技场同口径）
    SPAR_WIN_STONES: 30,    // 切磋彩头（小额，一日一回封顶）
    SPAR_WIN_FAVOR: 2,      // 赢了交情 +2
    FAVOR_TIER1: 5,         // 借抄入门流通卷的交情门槛
    FAVOR_TIER2: 8,         // 借抄内门真传卷的交情门槛
    BORROW_MASTERY: 30      // 抄本到手时的掌握度（三成——深修得下真功夫）
};

function sectVisitChar() {
    var d = null;
    try { d = (typeof window.getCurrentCharData === 'function') ? window.getCurrentCharData() : null; } catch (e) {}
    return d || window.currentCharData || null;
}
function sectVisitMsg(m, t) { if (window.showMessage) window.showMessage(m, t || 'info'); }
function sectVisitDay() {
    try {
        if (window.timeSystem && typeof window.timeSystem.getAbsoluteDay === 'function') return Number(window.timeSystem.getAbsoluteDay()) || 0;
    } catch (e) {}
    return 0;
}
function sectVisitPassTime(minutes, reason) {
    try {
        if (window.timeSystem && typeof window.timeSystem.advanceTime === 'function') window.timeSystem.advanceTime(minutes, reason);
    } catch (e) {}
}
function sectVisitDeduct(n) {
    try {
        if (window.DataManager && typeof window.DataManager.deductSpiritStones === 'function') return !!window.DataManager.deductSpiritStones(n);
    } catch (e) {}
    return false;
}
function sectVisitCredit(n) {
    try {
        if (window.EconomyTransaction && typeof window.EconomyTransaction.credit === 'function') { window.EconomyTransaction.credit('spiritStones', n); return; }
        if (window.DataManager && typeof window.DataManager.addSpiritStones === 'function') window.DataManager.addSpiritStones(n);
    } catch (e) {}
}
function sectVisitRealmTier(r) {
    try { if (typeof window.getRealmTier === 'function') return Math.max(1, Number(window.getRealmTier(r)) || 1); } catch (e) {}
    return 1;
}
// 一人一本的交情账：{ favor, lastGiftDay, lastSparDay, borrowed:{artId:day} }
function sectVisitLedger(sectName) {
    var c = sectVisitChar();
    if (!c || !sectName) return null;
    if (!c._sectVisit || typeof c._sectVisit !== 'object') c._sectVisit = {};
    var e = c._sectVisit[sectName];
    if (!e || typeof e !== 'object') e = c._sectVisit[sectName] = {};
    if (typeof e.favor !== 'number' || !isFinite(e.favor) || e.favor < 0) e.favor = 0;
    if (!e.borrowed || typeof e.borrowed !== 'object') e.borrowed = {};
    return e;
}
function sectVisitFavor(sectName) {
    var c = sectVisitChar();
    var e = c && c._sectVisit ? c._sectVisit[sectName] : null;
    return (e && Number(e.favor)) || 0;
}
function sectVisitArts(sectName) {
    try {
        var t = window.SECT_SPECIFIC_ARTS && window.SECT_SPECIFIC_ARTS[sectName];
        return Array.isArray(t) ? t : [];
    } catch (e) { return []; }
}
function sectVisitInsights() {
    var ds = window.discipleState || (window.discipleState = {});
    if (!ds.artInsights || typeof ds.artInsights !== 'object') ds.artInsights = {};
    return ds.artInsights;
}
// 借抄门槛：返回 null 可抄；否则返回门槛话术
function sectVisitBorrowGate(art, favor) {
    var t = Number(art.tier) || 1;
    if (t >= 4 || art.transmit === 'direct') return '镇派神功，非亲传不外授';
    if (t >= 2 && favor < SECT_VISIT_CFG.FAVOR_TIER2) return '交情不足（需 ' + SECT_VISIT_CFG.FAVOR_TIER2 + '，现有 ' + favor + '）';
    if (t < 2 && favor < SECT_VISIT_CFG.FAVOR_TIER1) return '交情不足（需 ' + SECT_VISIT_CFG.FAVOR_TIER1 + '，现有 ' + favor + '）';
    return null;
}

// ---------- 一 · 递拜山帖 ----------
function sectVisitGift(sectName) {
    var c = sectVisitChar();
    if (!c) { sectVisitMsg('请先创建角色。', 'warning'); return false; }
    var e = sectVisitLedger(sectName);
    if (!e) return false;
    if (e.lastGiftDay === sectVisitDay()) { sectVisitMsg('🎁 今日已递过拜山帖——知客弟子笑着拱手：「帖收下了，人天天见，礼就不必天天带了。」', 'info'); return false; }
    if (!sectVisitDeduct(SECT_VISIT_CFG.GIFT_COST)) { sectVisitMsg('礼金不齐（需 ' + SECT_VISIT_CFG.GIFT_COST + ' 灵石）——空手上山，门房也不好替你通传。', 'warning'); return false; }
    e.favor += 1;
    e.lastGiftDay = sectVisitDay();
    sectVisitPassTime(30, '拜山递帖');
    sectVisitMsg('🎁 你递上拜山帖与礼金，知客弟子引你入偏厅奉茶——「' + sectName + '」记住了你的名号。（交情 +1）', 'success');
    try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (eUi) {}
    try { showSectOuterView(sectName); } catch (eRe) {}
    return true;
}

// ---------- 二 · 演武切磋 ----------
function sectVisitSpar(sectName) {
    var c = sectVisitChar();
    if (!c) { sectVisitMsg('请先创建角色。', 'warning'); return false; }
    var e = sectVisitLedger(sectName);
    if (!e) return false;
    if (e.lastSparDay === sectVisitDay()) { sectVisitMsg('⚔️ 今日已切磋过——执役弟子揉着手腕苦笑：「明日再来，容我先养养筋骨。」', 'info'); return false; }
    var energy = Number(c.energy != null ? c.energy : 100) || 0;
    if (energy < SECT_VISIT_CFG.SPAR_ENERGY) { sectVisitMsg('精力不足，演武场上站不稳——歇够了再来。', 'warning'); return false; }
    if (typeof window.startBattle !== 'function') { sectVisitMsg('演武场今日封场（战斗系统未就绪）。', 'warning'); return false; }

    c.energy = energy - SECT_VISIT_CFG.SPAR_ENERGY;
    e.lastSparDay = sectVisitDay();
    sectVisitPassTime(60, '山门切磋');

    // 对手强弱：你的境界定基准，该宗体量加偏置（巨擘门下的执役弟子也不好惹）
    var tier = sectVisitRealmTier(c.realm);
    var info = (window.sectsData && window.sectsData[sectName]) || {};
    var bias = info.power === '巨擘' ? 2 : info.power === '大派' ? 1 : 0;
    var scale = 1 + bias * 0.1;
    var base = 30 + tier * 8;
    var lv = Math.max(1, (typeof window.realmScaledEnemyLevel === 'function' ? window.realmScaledEnemyLevel(c) : tier * 3) + bias);
    var enemyData = {
        name: '「' + sectName + '」演武场执役弟子（切磋）', type: 'enemy', physiologyType: 'humanoid',
        level: lv,
        attack: Math.round((base + 6) * scale), defense: Math.round((base * 0.6 + 4) * scale), speed: Math.round((18 + tier * 2) * scale),
        maxDurability: Math.round((90 + tier * 18) * scale), durabilities: { chest: Math.round((90 + tier * 18) * scale) },
        combatAbilities: [], sect: sectName
    };
    var b = window.startBattle(enemyData);
    if (b) {
        b._isSpar = true;             // 点到为止：不搜刮、不结仇、败不昏迷（既有语义）
        b.noSpoils = true;
        b._isSectVisitSpar = true;    // 拜山切磋标记：结算走 settleSectVisitSpar
        b._visitSect = sectName;
    }
    try { if (typeof window.updateCharacterStatus === 'function') window.updateCharacterStatus(); } catch (eSt) {}
    return !!b;
}

// 战后结算（app.js 切磋分支调用，与演武场切磋同挂法）
function settleSectVisitSpar(win) {
    var b = window.currentBattle || {};
    var sectName = b._visitSect;
    if (!sectName) return;
    var e = sectVisitLedger(sectName);
    if (!e) return;
    if (win) {
        e.favor += SECT_VISIT_CFG.SPAR_WIN_FAVOR;
        sectVisitCredit(SECT_VISIT_CFG.SPAR_WIN_STONES);
        sectVisitMsg('⚔️ 点到为止，你胜了半招——「' + sectName + '」的弟子们抱拳围观，管事的递来一袋彩头。（交情 +' + SECT_VISIT_CFG.SPAR_WIN_FAVOR + '，灵石 +' + SECT_VISIT_CFG.SPAR_WIN_STONES + '）', 'success');
        try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (eCur) {}
    } else {
        sectVisitMsg('⚔️ 切磋落败——执役弟子收势还礼：「阁下手底下有东西，养好了再来。」败而不辱，山门记你的胆气。', 'info');
    }
}

// ---------- 三 · 藏经借抄 ----------
function sectVisitBorrow(sectName, artId) {
    var c = sectVisitChar();
    if (!c) { sectVisitMsg('请先创建角色。', 'warning'); return false; }
    var e = sectVisitLedger(sectName);
    if (!e) return false;
    var arts = sectVisitArts(sectName);
    var art = null;
    for (var i = 0; i < arts.length; i++) { if (arts[i] && arts[i].id === artId) { art = arts[i]; break; } }
    if (!art) { sectVisitMsg('藏经阁查无此卷。', 'warning'); return false; }
    var ins = sectVisitInsights();
    if (ins[artId] && Number(ins[artId].m) > 0) { sectVisitMsg('📜 《' + art.name + '》你早已抄在手——不必重复花这笔抄费。', 'info'); return false; }
    var gate = sectVisitBorrowGate(art, e.favor);
    if (gate) { sectVisitMsg('📜 藏经阁执事摇头：「' + gate + '。」', 'warning'); return false; }
    var price = Number(art.copyPrice) || 300;
    if (!sectVisitDeduct(price)) { sectVisitMsg('抄费不齐（《' + art.name + '》需 ' + price + ' 灵石的纸墨与功德钱）。', 'warning'); return false; }
    ins[artId] = { heard: true, m: SECT_VISIT_CFG.BORROW_MASTERY, from: '借抄·' + sectName };
    e.borrowed[artId] = sectVisitDay();
    sectVisitPassTime(120, '藏经阁借抄');
    sectVisitMsg('📜 你在「' + sectName + '」藏经阁抄完《' + art.name + '》——抄本入手三成火候，运功栏里已可运转此功；要练到深处，得下真功夫。（抄费 ' + price + ' 灵石）', 'success');
    try { if (typeof window.updateCurrencyUI === 'function') window.updateCurrencyUI(); } catch (eC) {}
    try { showSectOuterView(sectName); } catch (eRe) {}
    return true;
}

// ---------- 外院待客卡（游客专属；自家弟子走贡献账，不在此列） ----------
function renderSectVisitHospitality(sectName, isMember) {
    if (isMember) return '';
    var c = sectVisitChar();
    if (!c) return '';
    var e = sectVisitLedger(sectName) || {};
    var favor = sectVisitFavor(sectName);
    var day = sectVisitDay();
    var ins = (window.discipleState && window.discipleState.artInsights) || {};
    var q = function (s) { return String(s).replace(/'/g, ''); };   // 名号进 onclick 前抹掉单引号，防串线
    var name = q(sectName);

    var h = '<div class="bg-gray-800/50 p-3 rounded border border-amber-700 col-span-full">';
    h += '<div class="flex items-center gap-2 mb-1"><span class="text-lg">🤝</span>' +
        '<div class="flex-1"><p class="font-bold text-sm text-white">拜山待客</p>' +
        '<p class="text-xs text-gray-400">个人交情 <span class="text-amber-300 font-bold">' + favor + '</span> 分——递帖 +1 · 切磋胜 +' + SECT_VISIT_CFG.SPAR_WIN_FAVOR + '</p></div></div>';
    h += '<div class="flex flex-wrap gap-2 mt-2">';
    h += '<button onclick="sectVisitGift(\'' + name + '\')" class="bg-amber-700 hover:bg-amber-600 text-white px-2 py-0.5 rounded text-xs font-bold">🎁 递拜山帖（礼金 ' + SECT_VISIT_CFG.GIFT_COST + '）' + (e.lastGiftDay === day ? ' · 今日已递' : '') + '</button>';
    h += '<button onclick="sectVisitSpar(\'' + name + '\')" class="bg-red-700 hover:bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">⚔️ 演武切磋（耗精力 ' + SECT_VISIT_CFG.SPAR_ENERGY + '）' + (e.lastSparDay === day ? ' · 今日已切磋' : '') + '</button>';
    h += '</div>';
    // 藏经借抄（外院知客代借——内院藏经阁是弟子才能进的）
    var arts = sectVisitArts(sectName);
    if (arts.length) {
        h += '<div class="border-t border-gray-700 mt-2 pt-2"><p class="text-xs text-yellow-400 font-bold mb-1">📜 藏经阁借抄 <span class="text-gray-500 font-normal">（交情 ' + SECT_VISIT_CFG.FAVOR_TIER1 + ' 分起抄流通卷，' + SECT_VISIT_CFG.FAVOR_TIER2 + ' 分起抄真传卷）</span></p>';
        arts.forEach(function (a) {
            var known = ins[a.id] && Number(ins[a.id].m) > 0;
            var gate = sectVisitBorrowGate(a, favor);
            var price = Number(a.copyPrice) || 300;
            var btn;
            if (known) btn = '<span class="text-[11px] text-green-400">已抄在手</span>';
            else if (gate) btn = '<span class="text-[11px] text-gray-500">' + gate + '</span>';
            else btn = '<button onclick="sectVisitBorrow(\'' + name + '\', \'' + q(a.id) + '\')" class="text-[11px] px-2 py-0.5 rounded bg-indigo-700 hover:bg-indigo-600 text-white">借抄 · ' + price + ' 灵石</button>';
            h += '<div class="flex justify-between items-center gap-2 py-0.5">' +
                '<span class="text-xs text-gray-200">《' + a.name + '》<span class="text-gray-500 text-[11px] ml-1">' + (a.grade || '') + (a.type ? ' · ' + a.type : '') + '</span></span>' + btn + '</div>';
        });
        h += '</div>';
    }
    h += '</div>';
    return h;
}

window.SECT_VISIT_CFG = SECT_VISIT_CFG;
window.sectVisitGift = sectVisitGift;
window.sectVisitSpar = sectVisitSpar;
window.sectVisitBorrow = sectVisitBorrow;
window.settleSectVisitSpar = settleSectVisitSpar;
window.sectVisitFavor = sectVisitFavor;
window.renderSectVisitHospitality = renderSectVisitHospitality;
