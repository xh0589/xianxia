// ==================== event-bus.js - 统一事件总线 ====================
// 为任务系统提供标准事件发射/订阅机制
// 加载顺序建议：第0.5层（game-state.js之后，quest-system.js之前）

// ==================== 事件总线实现 ====================
var EventBus = {
    // 事件存储：event_name -> [callback1, callback2, ...]
    events: {},

    // 注册事件监听器
    on: function(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        if (this.events[eventName].indexOf(callback) < 0) this.events[eventName].push(callback);
        return this; // 链式调用
    },

    // 发射事件
    emit: function(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('EventBus emit error:', e);
                }
            });
        }
        return this; // 链式调用
    },

    // 移除监听器
    off: function(eventName, callback) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        }
        return this;
    },

    // 一次性监听
    once: function(eventName, callback) {
        var self = this;
        function wrapped() {
            callback.apply(this, arguments);
            self.off(eventName, wrapped);
        }
        this.on(eventName, wrapped);
        return this;
    }
};

// 导出到全局窗口对象
if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
    // 兼容旧模块曾使用的 GameEvents 名称，统一到同一个事件源。
    window.GameEvents = EventBus;
}

// ==================== 标准事件类型 ====================
// 这些事件由各个模块在操作完成后发射，供任务系统订阅
var EventTypes = {
    ENEMY_DEFEATED: 'enemy:defeated',      // 敌人被击败
    ITEM_OBTAINED: 'item:obtained',        // 物品获得
    ITEM_CRAFTED: 'item:crafted',          // 物品制作
    NPC_TALKED: 'npc:talked',              // NPC交谈
    LOCATION_VISITED: 'location:visited',  // 地点访问
    DUNGEON_COMPLETED: 'dungeon:completed',// 秘境完成
    ARENA_WON: 'arena:won',                // 竞技场获胜
    ESCORT_COMPLETED: 'escort:completed',  // 护送完成
    TIME_ADVANCED: 'time:advanced',        // 游戏时间推进
    NEW_DAY: 'newDay',                    // 新的一天
    CULTIVATION_COMPLETED: 'cultivation:completed',
    CULTIVATION_BREAKTHROUGH: 'cultivation:breakthrough',
    PATROL_COMPLETED: 'patrol:completed',
    CLEAN_COMPLETED: 'clean:completed'
};
if (typeof window !== 'undefined') window.EventTypes = EventTypes;

console.log('[event-bus] 事件总线已初始化');