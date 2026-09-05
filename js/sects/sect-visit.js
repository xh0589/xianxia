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
    var power = sect.power || '未知';
    
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
                            : '<button onclick="useFacility(\'' + fid + '\')" class="mt-1 bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">使用</button>')) +
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
    
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = '' +
        '<div class="bg-gray-800 border-2 border-yellow-500 rounded-xl p-6 max-w-lg w-full mx-4">' +
        '<div class="flex justify-between items-center mb-4">' +
        '<h3 class="text-lg font-bold text-yellow-400">📋 ' + sectName + ' 公告栏</h3>' +
        '<button onclick="this.closest(\'.fixed\').remove()" class="text-gray-400 hover:text-white text-2xl">&times;</button>' +
        '</div>' +
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
        { id: 'spec_spirit_stone', name: '灵石', price: 100, icon: '💎' }
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
            '<button onclick="openFacilityUI()" class="mt-2 bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs font-bold">进入内院</button>' +
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
    var sect = window.sectsData?.[sectName];
    if (!sect) return;
    
    var ds = (typeof window.discipleState !== 'undefined') ? window.discipleState : { isInSect: false };
    var isMember = ds.isInSect && ds.sectId === sectName;
    var accessLevel = typeof window.getSectAccessLevel === 'function' ? window.getSectAccessLevel(sectName) : 0;
    
    // v12.3 温蘅线：进入百花谷时概率自动触发个人事件（世界驱动）
    if (isMember && sectName === '百花谷' && typeof window.maybeAutoTriggerBaihuaEvent === 'function') {
        try { window.maybeAutoTriggerBaihuaEvent('sect'); } catch (e) {}
    }
    // v12.3.1 绯泪线回灌：进入修罗宫时概率自动触发个人事件
    if (isMember && sectName === '修罗宫' && typeof window.maybeAutoTriggerFeiLeiEvent === 'function') {
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
    
    panel.innerHTML = '' +
        '<div class="bg-gray-900 rounded-xl border-2 border-yellow-600/50 p-6">' +
        // 头部
        '<div class="flex justify-between items-start mb-4">' +
        '<div>' +
        '<h2 class="text-2xl font-bold text-yellow-400">🏛️ ' + sectName + '</h2>' +
        '<div class="flex gap-2 mt-2 flex-wrap">' +
        '<span class="px-2 py-0.5 rounded text-xs font-bold ' + (
            sect.type === '正道' ? 'bg-green-900 text-green-400' :
            sect.type === '邪派' ? 'bg-red-900 text-red-400' :
            'bg-yellow-900 text-yellow-400'
        ) + '">' + sect.type + '</span>' +
        '<span class="text-xs text-gray-400">📍 ' + (sect.location || '未知') + '</span>' +
        '<span class="text-xs text-gray-400">⚔️ ' + (sect.power || '未知') + '</span>' +
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
        '<div class="bg-gray-800/50 p-2 rounded"><p class="text-xs text-gray-400">类型</p><p class="text-sm text-white font-bold">' + (sect.type || '?') + '</p></div>' +
        '<div class="bg-gray-800/50 p-2 rounded"><p class="text-xs text-gray-400">实力</p><p class="text-sm text-white font-bold">' + (sect.power || '?') + '</p></div>' +
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
    
    var panel = document.getElementById('sect-panel');
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
    
    var panel = document.getElementById('sect-panel');
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
                ? '<button onclick="useFacility(\'' + fid + '\')" class="bg-yellow-600 hover:bg-yellow-500 text-gray-900 px-2 py-1 rounded text-xs font-bold">使用</button>'
                : '<span class="text-xs text-gray-500">权限不足</span>') +
            '</div></div>';
    }).join('');
    
    // 门派特色功能
    var specialty = (typeof window.getSectSpecialty === 'function') ? window.getSectSpecialty(sectName) : null;
    var specialtyHtml = '';
    if (specialty) {
        var cd = (typeof window.getSectSpecialtyCooldown === 'function') ? window.getSectSpecialtyCooldown(sectName) : { ready: true, remaining: 0 };
        var canUse = ds.rank <= specialty.rankReq && cd.ready;
        var cdText = cd.ready ? '准备就绪' : ('冷却中 ' + cd.remaining + 'h');
        var cdClass = cd.ready ? 'text-green-400' : 'text-yellow-400';
        
        specialtyHtml = '' +
            '<div class="bg-gray-800/40 p-3 rounded border ' + (canUse ? 'border-purple-600' : 'border-gray-700 opacity-60') + ' mb-4">' +
            '<div class="flex items-center gap-2">' +
            '<span class="text-2xl">' + (specialty.icon || '✨') + '</span>' +
            '<div class="flex-1">' +
            '<p class="font-bold text-sm text-white">✨ ' + specialty.name + '</p>' +
            '<p class="text-xs text-gray-400">' + specialty.desc + '</p>' +
            '<p class="text-xs text-purple-400 mt-1">效果：' + specialty.effect + '</p>' +
            '<p class="text-xs ' + cdClass + '">⏱️ ' + cdText + '（冷却' + specialty.cooldown + 'h）</p>' +
            '</div>' +
            (canUse
                ? '<button onclick="useSectSpecialty(\'' + sectName + '\')" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded text-sm font-bold">使用</button>'
                : '<span class="text-xs text-gray-500">' + (cd.ready ? '权限不足' : '冷却中') + '</span>') +
            '</div></div>';
    }
    
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
        (specialtyHtml ? '<h3 class="text-lg font-bold text-purple-400 mb-2">✨ 门派特色</h3>' + specialtyHtml : '') +
        // 内院设施列表
        '<h3 class="text-lg font-bold text-blue-400 mb-2">🏛️ 内院设施</h3>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">' +
        (innerHtml || '<p class="text-gray-500 text-sm col-span-full">暂无可用设施</p>') +
        '</div>' +
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
    
    // 按关系排序
    var entries = Object.keys(diplomacy).map(function(other) {
        var d = diplomacy[other];
        var otherType = sects[other] ? sects[other].type : '未知';
        var relInfo = getSectRelationLabel(d.relation);
        return {
            name: other, type: otherType, relation: d.relation,
            label: relInfo.label, color: relInfo.color, icon: relInfo.icon,
            trade: d.trade || 0, conflicts: d.conflicts || 0
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
            if (e.relation < 0 && window.discipleState && window.discipleState.isInSect) {
                html += '<button onclick="initiateSectConflict(\'' + sectName + '\', \'' + e.name + '\')" class="text-red-400 hover:text-red-300">⚔️ 征讨</button>';
            }
            if (e.relation >= 20 && window.discipleState && window.discipleState.isInSect) {
                html += '<button onclick="proposeSectAlliance(\'' + sectName + '\', \'' + e.name + '\')" class="text-green-400 hover:text-green-300">🤝 结盟</button>';
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
    
    window.showModal('门派外交', html);
}

// 发起征讨
function initiateSectConflict(mySect, targetSect) {
    if (!confirm('确定向 ' + targetSect + ' 发起征讨？这将消耗门派资源并可能引发全面战争！')) return;
    if (SECT_DIPLOMACY_STATE[mySect] && SECT_DIPLOMACY_STATE[mySect][targetSect]) {
        SECT_DIPLOMACY_STATE[mySect][targetSect].relation -= 20;
        SECT_DIPLOMACY_STATE[mySect][targetSect].conflicts += 1;
    }
    if (SECT_DIPLOMACY_STATE[targetSect] && SECT_DIPLOMACY_STATE[targetSect][mySect]) {
        SECT_DIPLOMACY_STATE[targetSect][mySect].relation -= 20;
    }
    saveSectDiplomacy();
    if (window.showMessage) window.showMessage('⚔️ 向 ' + targetSect + ' 发起征讨！关系恶化', 'error');
    showSectDiplomacy(mySect);
}

// 提议结盟
function proposeSectAlliance(mySect, targetSect) {
    if (!confirm('确定向 ' + targetSect + ' 提议结盟？')) return;
    if (SECT_DIPLOMACY_STATE[mySect] && SECT_DIPLOMACY_STATE[mySect][targetSect]) {
        SECT_DIPLOMACY_STATE[mySect][targetSect].relation += 15;
        SECT_DIPLOMACY_STATE[mySect][targetSect].treaties.push('alliance');
    }
    if (SECT_DIPLOMACY_STATE[targetSect] && SECT_DIPLOMACY_STATE[targetSect][mySect]) {
        SECT_DIPLOMACY_STATE[targetSect][mySect].relation += 15;
    }
    saveSectDiplomacy();
    if (window.showMessage) window.showMessage('🤝 与 ' + targetSect + ' 结盟成功！关系提升', 'success');
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
