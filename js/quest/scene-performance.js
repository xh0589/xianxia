// ==================== scene-performance.js - 剧情场景演出化系统 ====================
// 让剧情从"弹窗"变成"完整场景演出"
// 场景描写+角色头像+表情切换+打字机效果+选择分支
// 依赖：quest-system.js (showStoryDialogue, STORY_DIALOGUES)
// 加载顺序：在 quest-system.js 之后，app.js 之前

// ============ 场景演出数据定义 ============
// 扩展故事对话数据结构，添加场景/角色/演出信息
const SCENE_PERFORMANCE_DATA = {
    // 主线场景
    'main_021': {
        scene: { location: '金丹秘境', time: '午时', weather: '晴朗', atmosphere: '庄严肃穆', bgColor: 'from-yellow-900/60 to-amber-800/40' },
        characters: [
            { id: 'mentor_01', name: '清虚道人', avatar: '🧘', emotion: 'serious', position: 'left' }
        ],
        interactables: [
            { id: 'ancient_altar', name: '上古祭坛', desc: '一座古老的祭坛，上面刻满了符文' }
        ]
    },
    'main_024': {
        scene: { location: '血色漩涡', time: '黄昏', weather: '血月', atmosphere: '诡异恐怖', bgColor: 'from-red-900/70 to-purple-900/60' },
        characters: [
            { id: 'rival_01', name: '柳随风', avatar: '🗡️', emotion: 'mysterious', position: 'right' }
        ],
        interactables: [
            { id: 'blood_altar', name: '血祭坛', desc: '散发着浓重血腥味的祭坛' }
        ]
    },
    'main_033': {
        scene: { location: '魔教总部', time: '午夜', weather: '雷雨', atmosphere: '紧张激烈', bgColor: 'from-gray-900/80 to-red-900/70' },
        characters: [
            { id: 'boss', name: '魔教教主', avatar: '👹', emotion: 'angry', position: 'right' }
        ]
    },
    // NPC故事场景
    'npc_mentor_01': {
        scene: { location: '青云门·修炼室', time: '清晨', weather: '晴朗', atmosphere: '宁静祥和', bgColor: 'from-blue-900/50 to-purple-800/30' },
        characters: [
            { id: 'mentor_01', name: '清虚道人', avatar: '🧘', emotion: 'warm', position: 'center' }
        ]
    },
    'npc_mentor_03': {
        scene: { location: '魔教旧址', time: '黄昏', weather: '阴天', atmosphere: '伤感', bgColor: 'from-gray-800/70 to-purple-900/50' },
        characters: [
            { id: 'mentor_01', name: '清虚道人', avatar: '🧘', emotion: 'sad', position: 'center' },
            { id: 'npc_female', name: '魔教圣女', avatar: '👩', emotion: 'sad', position: 'left' }
        ]
    },
    'npc_healer_01': {
        scene: { location: '医馆', time: '上午', weather: '晴朗', atmosphere: '温馨', bgColor: 'from-green-900/50 to-teal-800/30' },
        characters: [
            { id: 'healer_01', name: '灵素', avatar: '💊', emotion: 'happy', position: 'center' }
        ]
    },
    'npc_warrior_03': {
        scene: { location: '演武场', time: '正午', weather: '晴朗', atmosphere: '激烈', bgColor: 'from-red-900/50 to-orange-800/30' },
        characters: [
            { id: 'warrior_01', name: '铁山', avatar: '⚔️', emotion: 'determined', position: 'center' }
        ]
    },
    'npc_rival_03': {
        scene: { location: '悬崖边', time: '黄昏', weather: '大风', atmosphere: '紧张', bgColor: 'from-gray-800/70 to-blue-900/50' },
        characters: [
            { id: 'rival_01', name: '柳随风', avatar: '🗡️', emotion: 'serious', position: 'center' }
        ]
    }
};

// 默认场景（用于没有特殊配置的故事）
const DEFAULT_SCENE = {
    scene: { location: '未知之地', time: '未知', weather: '未知', atmosphere: '神秘', bgColor: 'from-gray-800/60 to-gray-900/40' },
    characters: [
        { id: 'narrator', name: '旁白', avatar: '📖', emotion: 'neutral', position: 'center' }
    ],
    interactables: []
};

// 角色表情映射
const CHARACTER_EMOTIONS = {
    'happy': { icon: '😊', label: '开心', color: 'text-green-400' },
    'sad': { icon: '😢', label: '悲伤', color: 'text-blue-400' },
    'angry': { icon: '😠', label: '愤怒', color: 'text-red-500' },
    'serious': { icon: '😐', label: '严肃', color: 'text-gray-300' },
    'warm': { icon: '😌', label: '温和', color: 'text-yellow-400' },
    'mysterious': { icon: '🤔', label: '神秘', color: 'text-purple-400' },
    'determined': { icon: '💪', label: '坚定', color: 'text-orange-400' },
    'hesitant': { icon: '😅', label: '犹豫', color: 'text-yellow-300' },
    'grateful': { icon: '🙏', label: '感激', color: 'text-green-300' },
    'generous': { icon: '🎁', label: '慷慨', color: 'text-red-300' },
    'deep': { icon: '💭', label: '深情', color: 'text-pink-400' },
    'solemn': { icon: '🤲', label: '庄重', color: 'text-yellow-300' },
    'neutral': { icon: '😶', label: '平静', color: 'text-gray-300' },
    'friendly': { icon: '🤗', label: '友善', color: 'text-green-300' }
};

// 天气图标
const WEATHER_ICONS = {
    '晴朗': '☀️', '阴天': '☁️', '雨天': '🌧️', '雷雨': '⛈️',
    '下雪': '❄️', '大风': '💨', '血月': '🌕', '雾天': '🌫️'
};

// 时间段图标
const TIME_ICONS = {
    '清晨': '🌅', '上午': '☀️', '正午': '🌞', '下午': '🌤️',
    '黄昏': '🌆', '傍晚': '🌇', '夜晚': '🌙', '午夜': '🌃',
    '子时': '🌙', '黎明': '🌅', '早晨': '☀️'
};

// ============ 打字机效果 ============
function typewriterEffect(element, text, speed = 25, callback) {
    let index = 0;
    element.textContent = '';
    element.style.visibility = 'visible';
    // F-39：取消令牌——每次新链自增；type 每轮校验令牌一致才写，避免连点"继续"致两条链并发追加乱码
    const token = (element._typeToken = (element._typeToken || 0) + 1);

    function type() {
        if (token !== element._typeToken) return; // 已被新链/关闭取消
        if (index < text.length) {
            element.textContent += text[index];
            index++;
            // 标点符号停顿
            const delay = '，。！？；：、……'.includes(text[index - 1]) ? speed * 4 : speed;
            setTimeout(type, delay);
        } else if (callback) {
            callback();
        }
    }
    type();
}

// ============ 获取场景演出数据 ============
function getSceneData(storyId) {
    return SCENE_PERFORMANCE_DATA[storyId] || DEFAULT_SCENE;
}

// ============ 场景演出渲染（替换原有的showStoryDialogue） ============
function showScenePerformance(storyData, questTitle, questId) {
    if (!storyData) return;

    // 获取场景配置
    const sceneId = questId || 'default';
    const sceneConfig = getSceneData(sceneId);

    // 创建场景容器
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[60] flex items-center justify-center scene-performance-modal';
    modal.style.background = `linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.85) 100%)`;
    modal.style.backdropFilter = 'blur(6px)';
    modal.onclick = (e) => { if (e.target === modal) closeScenePerformance(modal); };

    // 场景信息
    const scene = sceneConfig.scene;
    const weatherIcon = WEATHER_ICONS[scene.weather] || '';
    const timeIcon = TIME_ICONS[scene.time] || '';

    // 构建角色HTML
    let charactersHtml = '';
    sceneConfig.characters.forEach(char => {
        const emotion = CHARACTER_EMOTIONS[char.emotion] || CHARACTER_EMOTIONS.neutral;
        charactersHtml += `
            <div class="character-display text-center" data-char="${char.id}" data-emotion="${char.emotion}"
                 style="min-width: 80px; animation: charFadeIn 0.8s ease;">
                <div class="text-5xl mb-2 character-avatar transition-all duration-500">${char.avatar}</div>
                <div class="text-xs ${emotion.color} character-emotion transition-all duration-300">${emotion.icon} ${emotion.label}</div>
                <div class="text-xs text-gray-400 mt-1">${char.name}</div>
            </div>
        `;
    });

    // 可交互物件
    let interactablesHtml = '';
    if (sceneConfig.interactables && sceneConfig.interactables.length > 0) {
        interactablesHtml = `
            <div class="flex gap-2 justify-center mb-4">
                ${sceneConfig.interactables.map(obj => `
                    <button onclick="showMessage('${obj.desc}', 'info')"
                        class="px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded text-xs text-gray-400 hover:text-gray-200 transition border border-gray-600/30">
                        🔍 ${obj.name}
                    </button>
                `).join('')}
            </div>
        `;
    }

    // 构建对话内容
    let dialogueHtml = '';
    const dialogues = [];

    // 收集所有对话文本
    if (storyData.accept) dialogues.push({ speaker: 'narrator', text: storyData.accept, type: 'accept' });
    if (storyData.progress) dialogues.push({ speaker: 'narrator', text: storyData.progress, type: 'progress' });
    if (storyData.complete) dialogues.push({ speaker: 'narrator', text: storyData.complete, type: 'complete' });

    // 如果有choices，添加到最后一个对话
    let hasChoices = storyData.choices && storyData.choices.length > 0;

    // 构建主界面
    modal.innerHTML = `
        <div class="bg-gray-800/90 border-2 border-yellow-600/40 rounded-xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto"
             style="box-shadow: 0 0 60px rgba(234,179,8,0.1); background: linear-gradient(135deg, rgba(31,41,55,0.95) 0%, rgba(17,24,39,0.95) 100%);">
            <!-- 场景头部 -->
            <div class="p-4 border-b border-gray-700/50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">📖</span>
                        <h3 class="text-xl font-bold text-yellow-500">${questTitle || '剧情'}</h3>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-gray-500">
                        <span>${timeIcon} ${scene.time}</span>
                        <span>${weatherIcon} ${scene.weather}</span>
                        <span>📍 ${scene.location}</span>
                        <button onclick="closeScenePerformance(this.closest('.scene-performance-modal'))" class="text-gray-400 hover:text-white text-xl">&times;</button>
                    </div>
                </div>
                <div class="mt-1 text-xs text-gray-500 italic">「${scene.atmosphere}」</div>
            </div>

            <!-- 角色演出区域 -->
            <div class="p-4">
                <div class="flex justify-center gap-6 mb-4">
                    ${charactersHtml}
                </div>

                ${interactablesHtml}

                <!-- 对话区域 -->
                <div class="bg-gray-900/70 rounded-lg p-4 border border-gray-700/30 min-h-[120px]" id="dialogue-container">
                    <div class="flex items-start gap-2" id="dialogue-content">
                        <span class="text-2xl flex-shrink-0" id="dialogue-speaker-icon">📖</span>
                        <div class="flex-1">
                            <div class="text-sm font-bold text-yellow-400 mb-1" id="dialogue-speaker-name">旁白</div>
                            <div class="text-gray-200 leading-relaxed text-sm" id="dialogue-text"></div>
                        </div>
                    </div>
                </div>

                <!-- 分支选择 -->
                ${hasChoices ? `
                <div class="mt-3 border-t border-gray-700/50 pt-3" id="choices-container">
                    <p class="text-xs text-gray-500 mb-2">你的选择：</p>
                    <div class="space-y-1.5">
                        ${storyData.choices.map((choice, idx) => `
                            <button onclick="handleSceneChoice(${idx}, this)"
                                class="w-full text-left p-2 bg-gray-700/50 hover:bg-gray-600/50 hover:border-yellow-500/50 rounded text-sm text-gray-200 transition border border-gray-600/30"
                                data-action="${choice.action || ''}">
                                ${choice.text}
                            </button>
                        `).join('')}
                    </div>
                </div>` : ''}

                <!-- 操作按钮 -->
                <div class="flex justify-between items-center mt-4">
                    <div class="text-xs text-gray-500" id="scene-progress">第1段 / 共${dialogues.length}段</div>
                    <div class="flex gap-2">
                        ${dialogues.length > 1 ? `
                        <button onclick="advanceSceneDialogue()"
                            class="px-4 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500
                                   text-white text-sm font-bold rounded-lg transition-all transform hover:scale-105"
                            id="next-dialogue-btn">
                            继续 ▶
                        </button>` : ''}
                        <button onclick="closeScenePerformance(this.closest('.scene-performance-modal'))"
                            class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition">
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 对话播放状态
    let currentDialogueIndex = 0;
    const dialoguesList = dialogues;

    // 播放第一个对话
    if (dialoguesList.length > 0) {
        playDialogue(dialoguesList[0], 0, dialoguesList.length);
    }

    // 存储对话列表到modal元素，供advanceSceneDialogue访问
    modal._dialogues = dialoguesList;
    modal._currentIndex = 0;

    // 添加动画样式
    if (!document.getElementById('scene-perf-style')) {
        const style = document.createElement('style');
        style.id = 'scene-perf-style';
        style.textContent = `
            @keyframes charFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes dialogueSlideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
            .scene-performance-modal { animation: perfFadeIn 0.3s ease; }
            @keyframes perfFadeIn { from { opacity: 0; } to { opacity: 1; } }
        `;
        document.head.appendChild(style);
    }
}

// ============ 播放对话 ============
function playDialogue(dialogue, index, total) {
    const modal = document.querySelector('.scene-performance-modal');
    if (!modal) return;

    const speakerIcon = document.getElementById('dialogue-speaker-icon');
    const speakerName = document.getElementById('dialogue-speaker-name');
    const dialogueText = document.getElementById('dialogue-text');
    const progress = document.getElementById('scene-progress');

    // 更新进度
    if (progress) {
        progress.textContent = `第${index + 1}段 / 共${total}段`;
    }

    // 根据对话类型设置发言人
    let icon = '📖', name = '旁白', color = 'text-yellow-400', textColor = 'text-gray-200';

    if (dialogue.type === 'accept') {
        icon = '📜'; name = '任务接取'; color = 'text-green-400';
    } else if (dialogue.type === 'progress') {
        icon = '📋'; name = '任务进展'; color = 'text-blue-400';
    } else if (dialogue.type === 'complete') {
        icon = '✅'; name = '任务完成'; color = 'text-green-400';
    }

    // 查找是否有匹配的角色
    const sceneConfig = getSceneData(modal._questId || '');
    if (sceneConfig.characters && sceneConfig.characters.length > 0) {
        // 如果对话带有speaker标记，使用对应角色
        if (dialogue.speaker) {
            const char = sceneConfig.characters.find(c => c.id === dialogue.speaker);
            if (char) {
                const emotion = CHARACTER_EMOTIONS[char.emotion] || CHARACTER_EMOTIONS.neutral;
                icon = char.avatar;
                name = char.name;
                color = emotion.color;
            }
        }
    }

    // 更新UI
    if (speakerIcon) {
        speakerIcon.style.animation = 'none';
        speakerIcon.offsetHeight; // 触发回流
        speakerIcon.style.animation = 'dialogueSlideIn 0.3s ease';
        speakerIcon.textContent = icon;
    }
    if (speakerName) {
        speakerName.className = `text-sm font-bold ${color} mb-1`;
        speakerName.textContent = name;
    }

    // 打字机效果
    if (dialogueText) {
        dialogueText.style.animation = 'none';
        dialogueText.offsetHeight;
        dialogueText.style.animation = 'dialogueSlideIn 0.3s ease';
        typewriterEffect(dialogueText, dialogue.text, 20);
    }

    // 更新"继续"按钮
    const nextBtn = document.getElementById('next-dialogue-btn');
    if (nextBtn) {
        if (index < total - 1) {
            nextBtn.textContent = '继续 ▶';
            nextBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'none';
        }
    }

    // 存储当前索引
    modal._currentIndex = index;
}

// ============ 推进对话 ============
function advanceSceneDialogue() {
    const modal = document.querySelector('.scene-performance-modal');
    if (!modal) return;

    const dialogues = modal._dialogues || [];
    const currentIndex = modal._currentIndex || 0;
    const nextIndex = currentIndex + 1;

    if (nextIndex < dialogues.length) {
        playDialogue(dialogues[nextIndex], nextIndex, dialogues.length);
    }
}

// ============ 处理分支选择 ============
function handleSceneChoice(choiceIndex, btnElement) {
    const modal = document.querySelector('.scene-performance-modal');
    if (!modal) return;

    const choicesContainer = document.getElementById('choices-container');
    if (choicesContainer) {
        // 禁用所有选择按钮
        const allBtns = choicesContainer.querySelectorAll('button');
        allBtns.forEach(b => {
            b.disabled = true;
            b.classList.remove('hover:bg-gray-600/50', 'hover:border-yellow-500/50');
            b.classList.add('opacity-60');
        });

        // 高亮选中的
        btnElement.classList.remove('bg-gray-700/50', 'border-gray-600/30');
        btnElement.classList.add('bg-yellow-700/50', 'border-yellow-500');

        // 显示选择结果
        const dialogueContainer = document.getElementById('dialogue-content');
        if (dialogueContainer) {
            const choiceText = btnElement.textContent.trim();
            const resultDiv = document.createElement('div');
            resultDiv.className = 'mt-3 p-2 bg-gray-800/50 rounded border border-yellow-600/30';
            resultDiv.style.animation = 'dialogueSlideIn 0.3s ease';
            resultDiv.innerHTML = `
                <div class="text-xs text-yellow-400 mb-1">你的选择：${choiceText}</div>
            `;
            dialogueContainer.appendChild(resultDiv);
        }

        // 执行action
        const action = btnElement.getAttribute('data-action');
        if (action) {
            try {
                eval(action);
            } catch (e) {
                console.warn('选择action执行失败:', e);
            }
        }
    }
}

// ============ 关闭场景演出 ============
function closeScenePerformance(modal) {
    // F-39：关闭时取消正在跑的打字机链（bump token 使旧 type 失效，不再写已分离节点）
    try {
        var dt = modal && modal.querySelector ? modal.querySelector('#dialogue-text') : null;
        if (dt) dt._typeToken = (dt._typeToken || 0) + 1;
    } catch (e) {}
    if (modal) {
        modal.style.animation = 'perfFadeOut 0.2s ease';
        modal.style.opacity = '0';
        setTimeout(() => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        }, 200);
    }

    // 添加淡出动画
    if (!document.getElementById('scene-perf-out-style')) {
        const style = document.createElement('style');
        style.id = 'scene-perf-out-style';
        style.textContent = `
            @keyframes perfFadeOut { from { opacity: 1; } to { opacity: 0; } }
        `;
        document.head.appendChild(style);
    }
}

// ============ 导出 ============
// quest-system.js 保持唯一 showStoryDialogue 入口，并在运行时委托到本模块。
if (typeof window !== 'undefined') {
    window.showScenePerformance = showScenePerformance;
    window.closeScenePerformance = closeScenePerformance;
    window.advanceSceneDialogue = advanceSceneDialogue;
    window.handleSceneChoice = handleSceneChoice;
    window.SCENE_PERFORMANCE_DATA = SCENE_PERFORMANCE_DATA;
    window.getSceneData = getSceneData;
    window.typewriterEffect = typewriterEffect;
}
