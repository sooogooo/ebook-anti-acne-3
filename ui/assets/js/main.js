// 主要JavaScript功能 - AI对话、主题切换、交互功能

// 安全工具函数 - 输入验证和XSS防护
const SecurityUtils = {
    // 清理HTML内容，防止XSS攻击
    sanitizeHTML: function(input) {
        if (!input || typeof input !== 'string') return '';

        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },

    // 验证和限制用户输入
    validateInput: function(input, maxLength = 500) {
        if (!input || typeof input !== 'string') return '';

        // 移除控制字符和多余空白
        let cleaned = input
            .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
            .replace(/\s+/g, ' ')           // 合并空白字符
            .trim();

        // 限制长度
        if (cleaned.length > maxLength) {
            cleaned = cleaned.substring(0, maxLength);
        }

        return cleaned;
    },

    // 安全地渲染用户内容
    safeRender: function(input, maxLength = 500) {
        return this.sanitizeHTML(this.validateInput(input, maxLength));
    },

    // 检查是否为安全的URL
    isSafeURL: function(url) {
        if (!url || typeof url !== 'string') return false;

        try {
            const parsed = new URL(url, window.location.origin);
            // 只允许http, https协议和相对路径
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    },

    // 防抖函数
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// 全局状态管理
const AppState = {
    currentTheme: 'rose-quartz',
    fontSize: 'medium',
    aiStyle: 'standard',
    aiLength: 'concise',
    chatHistory: [],
    designHistory: [],
    isVoiceInputSupported: false,
    currentSpeechRecognition: null
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadUserPreferences();
    initializeEventListeners();
    checkVoiceSupport();
    initializeAIFunctionality();
    loadHistoryData();
    setupTextSelectionAI();
}

// 加载用户偏好设置
function loadUserPreferences() {
    const savedTheme = localStorage.getItem('theme') || 'rose-quartz';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    const savedAiStyle = localStorage.getItem('aiStyle') || 'standard';
    const savedAiLength = localStorage.getItem('aiLength') || 'concise';

    AppState.currentTheme = savedTheme;
    AppState.fontSize = savedFontSize;
    AppState.aiStyle = savedAiStyle;
    AppState.aiLength = savedAiLength;

    applyTheme(savedTheme);
    applyFontSize(savedFontSize);
    updateAIStyleButtons(savedAiStyle);
    updateAILengthButtons(savedAiLength);
}

// 初始化事件监听器
function initializeEventListeners() {
    // 菜单切换
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    menuToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        menuToggle.querySelector('.material-symbols-outlined').textContent =
            navMenu.classList.contains('active') ? 'close' : 'menu';
    });

    // 点击外部关闭菜单
    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            menuToggle.querySelector('.material-symbols-outlined').textContent = 'menu';
        }
    });

    // 导航链接点击事件
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            handleNavigation(target);
        });
    });

    // 设置模态框
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');

    settingsBtn.addEventListener('click', () => openModal(settingsModal));
    closeSettings.addEventListener('click', () => closeModal(settingsModal));

    // 主题选择
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.dataset.theme;
            changeTheme(theme);
        });
    });

    // 字体大小选择
    const fontButtons = document.querySelectorAll('.font-btn');
    fontButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const size = this.dataset.size;
            changeFontSize(size);
        });
    });

    // AI风格选择
    const styleButtons = document.querySelectorAll('.style-btn');
    styleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const style = this.dataset.style;
            changeAIStyle(style);
        });
    });

    // AI长度选择
    const lengthButtons = document.querySelectorAll('.length-btn');
    lengthButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const length = this.dataset.length;
            changeAILength(length);
        });
    });

    // API密钥配置
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput) {
        // 加载保存的API密钥
        const savedApiKey = localStorage.getItem('openai_api_key') || '';
        apiKeyInput.value = savedApiKey;

        // 保存API密钥
        apiKeyInput.addEventListener('input', SecurityUtils.debounce(function(e) {
            const apiKey = e.target.value.trim();
            if (apiKey) {
                localStorage.setItem('openai_api_key', apiKey);
                showNotification('API密钥已保存', 'success');
            } else {
                localStorage.removeItem('openai_api_key');
                showNotification('API密钥已清除，将使用本地回复', 'info');
            }
        }, 1000));
    }

    // AI聊天功能
    initializeChatListeners();

    // 设计工具功能
    initializeDesignToolListeners();

    // 快速操作按钮
    document.getElementById('aiChatBtn').addEventListener('click', () => openModal(document.getElementById('aiChatModal')));
    document.getElementById('designToolBtn').addEventListener('click', () => openModal(document.getElementById('designModal')));

    // 电子书预览按钮
    const previewBookBtn = document.getElementById('previewBook');
    if (previewBookBtn) {
        previewBookBtn.addEventListener('click', toggleChapterPreview);
    }

    // 内容标签切换
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // 模态框背景点击关闭
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                closeModal(modal);
            });
        }
    });
}

// 主题切换功能
function changeTheme(theme) {
    AppState.currentTheme = theme;
    applyTheme(theme);
    localStorage.setItem('theme', theme);

    // 更新按钮状态
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
}

// 字体大小切换
function changeFontSize(size) {
    AppState.fontSize = size;
    applyFontSize(size);
    localStorage.setItem('fontSize', size);

    // 更新按钮状态
    document.querySelectorAll('.font-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === size);
    });
}

function applyFontSize(size) {
    document.body.setAttribute('data-font-size', size);
}

// AI风格切换
function changeAIStyle(style) {
    AppState.aiStyle = style;
    localStorage.setItem('aiStyle', style);
    updateAIStyleButtons(style);
}

function updateAIStyleButtons(style) {
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.style === style);
    });
}

// AI长度切换
function changeAILength(length) {
    AppState.aiLength = length;
    localStorage.setItem('aiLength', length);
    updateAILengthButtons(length);
}

function updateAILengthButtons(length) {
    document.querySelectorAll('.length-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.length === length);
    });
}

// 导航处理
function handleNavigation(target) {
    // 关闭移动菜单
    document.getElementById('navMenu').classList.remove('active');
    document.getElementById('menuToggle').querySelector('.material-symbols-outlined').textContent = 'menu';

    // 滚动到对应区域或打开模态框
    switch(target) {
        case 'home':
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
        case 'ai-chat':
            openModal(document.getElementById('aiChatModal'));
            break;
        case 'design':
            openModal(document.getElementById('designModal'));
            break;
        case 'history':
            showHistoryModal();
            break;
        case 'settings':
            openModal(document.getElementById('settingsModal'));
            break;
        default:
            console.log('Unknown navigation target:', target);
    }
}

// 模态框控制
function openModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // 特殊处理：如果是聊天模态框，聚焦输入框
        if (modal.id === 'aiChatModal') {
            setTimeout(() => {
                document.getElementById('chatInput').focus();
            }, 300);
        }
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // 停止语音输入
        if (AppState.currentSpeechRecognition) {
            AppState.currentSpeechRecognition.stop();
            AppState.currentSpeechRecognition = null;
        }
    }
}

// 标签切换功能
function switchTab(tabName) {
    // 更新标签按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // 更新标签内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('hidden', content.id !== tabName);
    });
}

// AI聊天功能
function initializeChatListeners() {
    const chatModal = document.getElementById('aiChatModal');
    const closeAiChat = document.getElementById('closeAiChat');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendMessage');
    const voiceBtn = document.getElementById('voiceInput');

    closeAiChat.addEventListener('click', () => closeModal(chatModal));

    // 发送消息
    const sendMessage = () => {
        const rawMessage = chatInput.value.trim();

        // 安全验证和清理输入
        const message = SecurityUtils.validateInput(rawMessage, 500);

        if (message) {
            // 使用安全渲染的内容显示用户消息
            addChatMessage('user', SecurityUtils.sanitizeHTML(message));
            chatInput.value = '';

            // 生成AI回复
            setTimeout(() => {
                generateAIResponse(message);
            }, 1000);
        } else if (rawMessage) {
            // 输入被过滤，显示提示
            addChatMessage('system', '输入内容包含不支持的字符，请重新输入。');
        }
    };

    sendBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 防抖输入处理（用于未来功能扩展，如输入建议）
    const debouncedInputHandler = SecurityUtils.debounce(function(e) {
        const input = e.target.value;
        // 这里可以添加输入建议、搜索等功能
        if (input.length > 3) {
            // 可以在这里添加智能建议功能
        }
    }, 300);

    chatInput.addEventListener('input', debouncedInputHandler);

    // 语音输入
    voiceBtn.addEventListener('click', toggleVoiceInput);

    // 推荐问题点击
    document.querySelectorAll('.question-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const question = this.textContent;
            chatInput.value = question;
            sendMessage();
        });
    });
}

// 添加聊天消息
function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = sender === 'user' ?
        '<span class="material-symbols-outlined">person</span>' :
        '<span class="material-symbols-outlined">smart_toy</span>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // 处理Markdown格式
    if (sender === 'ai') {
        contentDiv.innerHTML = processMarkdown(message);
    } else {
        contentDiv.textContent = message;
    }

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 保存到历史记录
    AppState.chatHistory.push({ sender, message, timestamp: Date.now() });
    saveChatHistory();
}

// 生成AI回复
async function generateAIResponse(userMessage) {
    try {
        // 显示AI正在思考的状态
        showTypingIndicator();

        const response = await callRealAI(userMessage);

        addChatMessage('ai', response);

        // 生成新的推荐问题
        updateSuggestedQuestions(userMessage, response);

    } catch (error) {
        console.error('AI API调用失败:', error);

        // 如果API调用失败，回退到本地回复
        const fallbackResponse = generateFallbackResponse(userMessage);
        addChatMessage('ai', fallbackResponse);

        showNotification('AI服务暂时不可用，已切换到本地回复', 'info');
    } finally {
        hideTypingIndicator();
    }
}

// 调用真实AI API
async function callRealAI(userMessage) {
    // 从设置中获取API密钥
    const apiKey = localStorage.getItem('openai_api_key') || '';
    const apiUrl = 'https://api.openai.com/v1/chat/completions'; // 或其他AI服务API

    if (!apiKey) {
        // 如果没有配置API密钥，使用本地回复
        return generateFallbackResponse(userMessage);
    }

    const systemPrompt = `你是一位专业的皮肤科医生助手，专门提供痤疮治疗和护肤相关的专业建议。请根据用户的提问风格调整回复方式：

当前设置：
- 风格：${AppState.aiStyle} (${AppState.aiStyle === 'humorous' ? '轻松幽默' : AppState.aiStyle === 'standard' ? '标准日常' : '科学严谨'})
- 长度：${AppState.aiLength} (${AppState.aiLength === 'concise' ? '简洁' : AppState.aiLength === 'standard' ? '标准' : '详细'})

请提供专业、安全、有用的医学建议，并在必要时提醒用户咨询专业医生。避免做出具体的诊断，重点提供科普知识和一般性建议。`;

    const requestBody = {
        model: "gpt-3.5-turbo", // 或其他适合的模型
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: userMessage
            }
        ],
        max_tokens: AppState.aiLength === 'concise' ? 150 : AppState.aiLength === 'standard' ? 300 : 500,
        temperature: AppState.aiStyle === 'humorous' ? 0.8 : 0.7
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// 回退到本地回复系统
function generateFallbackResponse(userMessage) {
    const style = AppState.aiStyle;
    const length = AppState.aiLength;

    // 根据关键词生成相关回复
    if (userMessage.includes('痘痘') || userMessage.includes('痤疮')) {
        return generateAcneResponse(style, length);
    } else if (userMessage.includes('护肤') || userMessage.includes('护理')) {
        return generateSkincareResponse(style, length);
    } else if (userMessage.includes('饮食') || userMessage.includes('食物')) {
        return generateDietResponse(style, length);
    } else {
        return generateGeneralResponse(style, length);
    }
}

// 显示AI正在思考的指示器
function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <span class="material-symbols-outlined">smart_toy</span>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 隐藏AI正在思考的指示器
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// 生成痤疮相关回复
function generateAcneResponse(style, length) {
    const responses = {
        humorous: {
            concise: "痘痘就像不请自来的客人，用科学的方法把它请出去！👋",
            standard: "痤疮是毛囊皮脂腺的慢性炎症，需要综合治疗。保持清洁、合理用药、调整作息都很重要。",
            detailed: "痤疮（痘痘）是一种常见的毛囊皮脂腺慢性炎症性疾病，主要与雄激素水平、皮脂分泌过多、毛囊口角化异常、痤疮丙酸杆菌感染等因素有关。治疗需要根据严重程度选择外用药（如维A酸类、过氧化苯甲酰）或口服药（如抗生素、异维A酸）。"
        },
        standard: {
            concise: "痤疮需要科学治疗，建议咨询皮肤科医生获得个性化方案。",
            standard: "痤疮治疗需要根据类型和严重程度制定方案。轻度可外用药，中重度可能需要口服药物治疗。",
            detailed: "痤疮治疗应遵循分级诊疗原则：轻度痤疮主要以外用药物治疗为主，如维A酸类药膏；中度痤疮可联合口服抗生素；重度痤疮可能需要口服异维A酸。同时配合适当的护肤和生活方式调整。建议在专业医生指导下进行治疗。"
        },
        scientific: {
            concise: "痤疮是多因素导致的毛囊皮脂腺慢性炎症，需要循证医学治疗。",
            standard: "痤疮发病涉及遗传、激素、皮脂分泌、微生物感染及免疫反应等多重因素。治疗应根据循证医学证据选择合适的干预措施。",
            detailed: "痤疮是毛囊皮脂腺单位的慢性炎症性疾病，其发病机制包括：1)雄激素刺激皮脂腺过度分泌；2)毛囊角化异常导致毛孔堵塞；3)痤疮丙酸杆菌增殖引发炎症；4)免疫反应加剧炎症过程。循证医学推荐的治疗方案包括外用维A酸、过氧化苯甲酰、口服抗生素、异维A酸等，需根据严重程度个体化治疗。"
        }
    };

    return responses[style][length];
}

// 生成护肤相关回复
function generateSkincareResponse(style, length) {
    const responses = {
        humorous: {
            concise: "护肤像谈恋爱，需要耐心和正确的步骤！💕",
            standard: "科学护肤包括清洁、保湿、防晒三要素，选择适合自己皮肤类型的产品很重要。",
            detailed: "科学护肤的基础是清洁-保湿-防晒。清洁要温和不刺激，保湿要选择适合皮肤类型的产品，防晒是预防和治疗痤疮的重要措施。此外，避免过度清洁和频繁去角质，保持皮肤屏障健康。建议根据皮肤类型（油性、干性、混合性、敏感性）选择相应的护肤品。"
        }
    };

    return responses[style]?.[length] || responses.standard[length];
}

// 生成饮食相关回复
function generateDietResponse(style, length) {
    return "饮食对痤疮有重要影响，建议减少高糖、高脂食物，增加蔬菜水果摄入，保持均衡营养。";
}

// 生成通用回复
function generateGeneralResponse(style, length) {
    return "感谢您的提问！如果您有关于痤疮治疗的具体问题，建议咨询专业皮肤科医生获得更准确的建议。";
}

// 处理Markdown格式
function processMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
        .replace(/(\d+\.\s)/g, '<br>$1');
}

// 更新推荐问题
function updateSuggestedQuestions(userMessage, aiResponse) {
    const suggestedQuestions = document.getElementById('suggestedQuestions');
    const questionChips = suggestedQuestions.querySelector('.question-chips');

    // 基于对话内容生成相关问题
    const newQuestions = generateFollowUpQuestions(userMessage, aiResponse);

    questionChips.innerHTML = '';
    newQuestions.forEach(question => {
        const chip = document.createElement('button');
        chip.className = 'question-chip';
        chip.textContent = question;
        chip.addEventListener('click', function() {
            document.getElementById('chatInput').value = question;
            document.getElementById('sendMessage').click();
        });
        questionChips.appendChild(chip);
    });
}

// 生成追问问题
function generateFollowUpQuestions(userMessage, aiResponse) {
    const questions = [
        "如何选择合适的护肤品？",
        "哪些食物会加重痘痘？",
        "熬夜对皮肤有什么影响？",
        "如何淡化痘印？",
        "需要看医生吗？"
    ];

    // 随机选择3-4个问题
    return questions.sort(() => Math.random() - 0.5).slice(0, 4);
}

// 语音输入功能
function checkVoiceSupport() {
    AppState.isVoiceInputSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    if (!AppState.isVoiceInputSupported) {
        const voiceBtn = document.getElementById('voiceInput');
        if (voiceBtn) {
            voiceBtn.style.display = 'none';
        }
    }
}

function toggleVoiceInput() {
    if (!AppState.isVoiceInputSupported) return;

    const voiceBtn = document.getElementById('voiceInput');
    const chatInput = document.getElementById('chatInput');

    if (AppState.currentSpeechRecognition) {
        // 停止录音
        AppState.currentSpeechRecognition.stop();
        AppState.currentSpeechRecognition = null;
        voiceBtn.innerHTML = '<span class="material-symbols-outlined">mic</span>';
        voiceBtn.classList.remove('recording');
    } else {
        // 开始录音
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = function() {
            voiceBtn.innerHTML = '<span class="material-symbols-outlined">stop</span>';
            voiceBtn.classList.add('recording');
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            voiceBtn.innerHTML = '<span class="material-symbols-outlined">mic</span>';
            voiceBtn.classList.remove('recording');
        };

        recognition.onend = function() {
            voiceBtn.innerHTML = '<span class="material-symbols-outlined">mic</span>';
            voiceBtn.classList.remove('recording');
            AppState.currentSpeechRecognition = null;
        };

        AppState.currentSpeechRecognition = recognition;
        recognition.start();
    }
}

// 设计工具功能
function initializeDesignToolListeners() {
    const designModal = document.getElementById('designModal');
    const closeDesign = document.getElementById('closeDesign');
    const generateBtn = document.getElementById('generatePlan');

    closeDesign.addEventListener('click', () => closeModal(designModal));

    generateBtn.addEventListener('click', generateSkincarePlan);

    // 导出功能
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.dataset.format;
            exportDesign(format);
        });
    });
}

// 生成护肤方案
function generateSkincarePlan() {
    const skinType = document.getElementById('skinType').value;
    const severity = document.getElementById('acneSeverity').value;
    const needs = Array.from(document.querySelectorAll('.need-checkboxes input:checked'))
        .map(input => input.value);

    const resultLoading = document.querySelector('.result-loading');
    const resultContent = document.querySelector('.result-content');

    // 显示加载状态
    resultLoading.classList.remove('hidden');
    resultContent.classList.add('hidden');

    // 模拟生成过程
    setTimeout(() => {
        const plan = generatePersonalizedPlan(skinType, severity, needs);
        displaySkincarePlan(plan);

        resultLoading.classList.add('hidden');
        resultContent.classList.remove('hidden');

        // 保存到历史记录
        AppState.designHistory.push({
            skinType,
            severity,
            needs,
            plan,
            timestamp: Date.now()
        });
        saveDesignHistory();
    }, 2000);
}

// 生成个性化方案
function generatePersonalizedPlan(skinType, severity, needs) {
    const plans = {
        oily: {
            mild: {
                'anti-inflammatory': '温和清洁 + 茶树精油点涂',
                'oil-control': '控油洁面 + 水杨酸护理',
                'scar-treatment': '维生素C精华 + 防晒'
            },
            moderate: {
                'anti-inflammatory': '抗炎洁面 + 过氧化苯甲酰',
                'oil-control': '控油套装 + 维A酸药膏',
                'scar-treatment': '烟酰胺精华 + 医美淡斑'
            },
            severe: {
                'anti-inflammatory': '药物治疗 + 专业护理',
                'oil-control': '口服药物 + 外用治疗',
                'scar-treatment': '医美治疗 + 专业淡疤'
            }
        }
    };

    // 简化的方案生成逻辑
    const severityMap = {
        '1': 'mild',
        '2': 'mild',
        '3': 'moderate',
        '4': 'moderate',
        '5': 'severe'
    };

    const severityLevel = severityMap[severity];
    const skinPlans = plans[skinType]?.[severityLevel] || plans.oily.moderate;

    let planText = `您的${skinType === 'oily' ? '油性' : skinType === 'dry' ? '干性' : skinType === 'combination' ? '混合性' : '敏感性'}皮肤${severityLevel === 'mild' ? '轻度' : severityLevel === 'moderate' ? '中度' : '重度'}痤疮护理方案：\n\n`;

    needs.forEach(need => {
        if (skinPlans[need]) {
            const needName = {
                'anti-inflammatory': '抗炎舒缓',
                'oil-control': '控油保湿',
                'scar-treatment': '淡化疤痕'
            }[need];

            planText += `**${needName}**：${skinPlans[need]}\n`;
        }
    });

    return planText;
}

// 显示护肤方案
function displaySkincarePlan(plan) {
    const planVisualization = document.getElementById('planVisualization');

    // 创建可视化方案
    const visualizationHTML = `
        <div class="plan-steps">
            ${plan.split('\n').filter(line => line.trim()).map(step =>
                `<div class="plan-step">
                    <div class="step-icon">
                        <span class="material-symbols-outlined">check_circle</span>
                    </div>
                    <div class="step-content">${processMarkdown(step)}</div>
                </div>`
            ).join('')}
        </div>
    `;

    planVisualization.innerHTML = visualizationHTML;
}

// 导出设计
function exportDesign(format) {
    const planContent = document.querySelector('.plan-steps');

    if (format === 'png') {
        exportAsPNG(planContent);
    } else if (format === 'pdf') {
        exportAsPDF(planContent);
    }
}

// 导出为PNG
function exportAsPNG(element) {
    try {
        // 显示加载状态
        const exportBtn = document.querySelector(`[onclick="exportAsPNG('${element}')"]`);
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.textContent = '导出中...';
        }

        const targetElement = document.getElementById(element);
        if (!targetElement) {
            throw new Error('找不到要导出的元素');
        }

        // 临时移除可能影响截图的样式
        const originalTransform = targetElement.style.transform;
        targetElement.style.transform = 'scale(1)';

        html2canvas(targetElement, {
            backgroundColor: '#ffffff',
            scale: 2, // 提高分辨率
            useCORS: true,
            allowTaint: true,
            logging: false
        }).then(canvas => {
            // 恢复原始样式
            targetElement.style.transform = originalTransform;

            // 创建下载链接
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            link.download = `痤疮护肤方案_${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // 显示成功提示
            showNotification('PNG导出成功！', 'success');

        }).catch(error => {
            console.error('PNG导出失败:', error);
            showNotification('PNG导出失败，请重试', 'error');
        }).finally(() => {
            // 恢复按钮状态
            if (exportBtn) {
                exportBtn.disabled = false;
                exportBtn.textContent = '导出PNG';
            }
        });

    } catch (error) {
        console.error('PNG导出错误:', error);
        showNotification('PNG导出失败，请重试', 'error');
    }
}

// 导出为PDF
function exportAsPDF(element) {
    try {
        // 显示加载状态
        const exportBtn = document.querySelector(`[onclick="exportAsPDF('${element}')"]`);
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.textContent = '导出中...';
        }

        const targetElement = document.getElementById(element);
        if (!targetElement) {
            throw new Error('找不到要导出的元素');
        }

        // 临时移除可能影响截图的样式
        const originalTransform = targetElement.style.transform;
        targetElement.style.transform = 'scale(1)';

        html2canvas(targetElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false
        }).then(canvas => {
            // 恢复原始样式
            targetElement.style.transform = originalTransform;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4宽度
            const pageHeight = 295; // A4高度
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            // 添加第一页
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // 如果内容超过一页，添加更多页
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // 创建下载链接
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            pdf.save(`痤疮护肤方案_${timestamp}.pdf`);

            // 显示成功提示
            showNotification('PDF导出成功！', 'success');

        }).catch(error => {
            console.error('PDF导出失败:', error);
            showNotification('PDF导出失败，请重试', 'error');
        }).finally(() => {
            // 恢复按钮状态
            if (exportBtn) {
                exportBtn.disabled = false;
                exportBtn.textContent = '导出PDF';
            }
        });

    } catch (error) {
        console.error('PDF导出错误:', error);
        showNotification('PDF导出失败，请重试', 'error');
    }
}

// 显示通知消息
function showNotification(message, type = 'info') {
    // 移除现有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="material-symbols-outlined">
                ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
            </span>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // 添加显示动画
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 划词AI功能
function setupTextSelectionAI() {
    let selectionTimeout;

    document.addEventListener('mouseup', function() {
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = SecurityUtils.validateInput(selection.toString(), 200);

            if (selectedText.length > 2) {
                showTextSelectionAI(selectedText);
            }
        }, 100);
    });

    document.addEventListener('mousedown', function() {
        clearTimeout(selectionTimeout);
        hideTextSelectionAI();
    });
}

// 显示划词AI
function showTextSelectionAI(selectedText) {
    // 移除现有的划词AI
    hideTextSelectionAI();

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const aiTooltip = document.createElement('div');
    aiTooltip.className = 'text-selection-ai';
    aiTooltip.innerHTML = `
        <div class="ai-tooltip-content">
            <p class="ai-question">关于"${selectedText.substring(0, 20)}${selectedText.length > 20 ? '...' : ''}"</p>
            <div class="ai-actions">
                <button class="ai-action-btn" data-action="explain">解释</button>
                <button class="ai-action-btn" data-action="relate">相关知识</button>
                <button class="ai-action-btn" data-action="advice">建议</button>
            </div>
        </div>
    `;

    // 设置位置
    aiTooltip.style.position = 'fixed';
    aiTooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    aiTooltip.style.left = `${rect.left + window.scrollX}px`;
    aiTooltip.style.zIndex = '3000';

    document.body.appendChild(aiTooltip);

    // 绑定事件
    aiTooltip.querySelectorAll('.ai-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            handleTextSelectionAI(selectedText, action);
            hideTextSelectionAI();
        });
    });
}

// 隐藏划词AI
function hideTextSelectionAI() {
    const existingTooltip = document.querySelector('.text-selection-ai');
    if (existingTooltip) {
        existingTooltip.remove();
    }
}

// 处理划词AI请求
function handleTextSelectionAI(selectedText, action) {
    let response = '';
    const safeText = SecurityUtils.sanitizeHTML(selectedText);

    switch(action) {
        case 'explain':
            response = `关于"${safeText}"的解释：这是一个医学相关的概念，建议咨询专业医生获取详细解释。`;
            break;
        case 'relate':
            response = `与"${safeText}"相关的知识点包括皮肤护理、治疗方案等，建议深入了解相关内容。`;
            break;
        case 'advice':
            response = `关于"${safeText}"的建议：请根据个人情况，在专业医生指导下进行相应的处理。`;
            break;
    }

    // 打开AI聊天并显示回复
    openModal(document.getElementById('aiChatModal'));
    setTimeout(() => {
        const userMessage = `关于"${safeText}"的${action === 'explain' ? '解释' : action === 'relate' ? '相关知识' : '建议'}`;
        addChatMessage('user', SecurityUtils.sanitizeHTML(userMessage));
        addChatMessage('ai', response);
    }, 300);
}

// 历史记录功能
function showHistoryModal() {
    // 创建历史记录模态框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'historyModal';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>历史记录</h3>
                <button class="close-btn" onclick="closeModal(this.closest('.modal-overlay'))">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="modal-content">
                <div class="history-tabs">
                    <button class="history-tab-btn active" data-type="chat">聊天记录</button>
                    <button class="history-tab-btn" data-type="design">设计方案</button>
                </div>
                <div class="history-content">
                    <div id="chatHistory" class="history-panel">
                        ${renderChatHistory()}
                    </div>
                    <div id="designHistory" class="history-panel hidden">
                        ${renderDesignHistory()}
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn-secondary" onclick="clearHistory()">清空记录</button>
                    <button class="btn-primary" onclick="exportHistory()">导出记录</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    openModal(modal);

    // 绑定历史记录标签切换
    modal.querySelectorAll('.history-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            switchHistoryTab(type);
        });
    });
}

// 渲染聊天历史
function renderChatHistory() {
    if (AppState.chatHistory.length === 0) {
        return '<p class="empty-state">暂无聊天记录</p>';
    }

    return AppState.chatHistory.slice(-10).reverse().map(item => `
        <div class="history-item">
            <div class="history-item-header">
                <span class="history-sender">${item.sender === 'user' ? '用户' : 'AI助手'}</span>
                <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
            </div>
            <div class="history-message">${item.message.substring(0, 100)}${item.message.length > 100 ? '...' : ''}</div>
        </div>
    `).join('');
}

// 渲染设计历史
function renderDesignHistory() {
    if (AppState.designHistory.length === 0) {
        return '<p class="empty-state">暂无设计方案</p>';
    }

    return AppState.designHistory.slice(-10).reverse().map(item => `
        <div class="history-item">
            <div class="history-item-header">
                <span class="history-sender">护肤方案</span>
                <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
            </div>
            <div class="history-message">
                皮肤类型：${item.skinType} | 严重程度：${item.severity}/5
            </div>
            <button class="load-plan-btn" onclick="loadDesignPlan('${item.timestamp}')">加载方案</button>
        </div>
    `).join('');
}

// 切换历史记录标签
function switchHistoryTab(type) {
    document.querySelectorAll('.history-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    document.getElementById('chatHistory').classList.toggle('hidden', type !== 'chat');
    document.getElementById('designHistory').classList.toggle('hidden', type !== 'design');
}

// 加载设计方案
function loadDesignPlan(timestamp) {
    const plan = AppState.designHistory.find(item => item.timestamp == timestamp);
    if (plan) {
        // 关闭历史记录模态框
        closeModal(document.getElementById('historyModal'));

        // 打开设计工具并加载方案
        setTimeout(() => {
            openModal(document.getElementById('designModal'));

            // 设置表单值
            document.getElementById('skinType').value = plan.skinType;
            document.getElementById('acneSeverity').value = plan.severity;

            // 显示方案
            document.querySelector('.result-loading').classList.add('hidden');
            document.querySelector('.result-content').classList.remove('hidden');
            displaySkincarePlan(plan.plan);
        }, 300);
    }
}

// 清空历史记录
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        AppState.chatHistory = [];
        AppState.designHistory = [];
        saveChatHistory();
        saveDesignHistory();

        // 刷新显示
        document.getElementById('chatHistory').innerHTML = '<p class="empty-state">暂无聊天记录</p>';
        document.getElementById('designHistory').innerHTML = '<p class="empty-state">暂无设计方案</p>';
    }
}

// 导出历史记录
function exportHistory() {
    const data = {
        chatHistory: AppState.chatHistory,
        designHistory: AppState.designHistory,
        exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acne-treatment-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// 保存历史记录到本地存储
function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(AppState.chatHistory.slice(-50))); // 只保存最近50条
}

function saveDesignHistory() {
    localStorage.setItem('designHistory', JSON.stringify(AppState.designHistory.slice(-20))); // 只保存最近20条
}

// 加载历史记录
function loadHistoryData() {
    try {
        const chatHistory = localStorage.getItem('chatHistory');
        const designHistory = localStorage.getItem('designHistory');

        if (chatHistory) {
            AppState.chatHistory = JSON.parse(chatHistory);
        }

        if (designHistory) {
            AppState.designHistory = JSON.parse(designHistory);
        }
    } catch (error) {
        console.error('Error loading history data:', error);
    }
}

// 初始化AI功能
function initializeAIFunctionality() {
    // 这里可以集成真实的AI API
    console.log('AI功能已初始化');
}

// 添加划词AI样式
const style = document.createElement('style');
style.textContent = `
.text-selection-ai {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 0.75rem;
    box-shadow: 0 4px 12px var(--shadow-color);
    max-width: 300px;
    z-index: 3000;
}

.ai-tooltip-content {
    text-align: center;
}

.ai-question {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.ai-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}

.ai-action-btn {
    background: var(--gradient-primary);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: all 0.2s ease;
}

.ai-action-btn:hover {
    transform: scale(1.05);
}

.recording {
    background: #ff4444 !important;
    color: white !important;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
}

.history-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.history-tab-btn {
    background: none;
    border: none;
    padding: 0.75rem 1rem;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
}

.history-tab-btn.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
}

.history-item {
    background: var(--gray-50);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.history-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.history-sender {
    font-weight: 600;
    color: var(--text-primary);
}

.history-time {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
}

.history-message {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: 0.5rem;
}

.load-plan-btn {
    background: var(--gradient-primary);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: all 0.2s ease;
}

.load-plan-btn:hover {
    transform: scale(1.05);
}

.empty-state {
    text-align: center;
    color: var(--text-muted);
    padding: 2rem;
}

.history-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}

.btn-primary,
.btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
}

.btn-primary {
    background: var(--gradient-primary);
    color: white;
}

.btn-secondary {
    background: var(--gray-100);
    color: var(--text-secondary);
}

.btn-primary:hover,
.btn-secondary:hover {
    transform: translateY(-2px);
}

.plan-steps {
    space-y: 1rem;
}

.plan-step {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    padding: 1rem;
    background: var(--gray-50);
    border-radius: 12px;
    margin-bottom: 1rem;
}

.step-icon {
    color: var(--primary-color);
    flex-shrink: 0;
}

.step-content {
    flex: 1;
    color: var(--text-secondary);
}
`;
document.head.appendChild(style);

// 电子书预览功能
function toggleChapterPreview() {
    const chapterPreview = document.getElementById('chapterPreview');
    const previewBookBtn = document.getElementById('previewBook');

    if (chapterPreview.classList.contains('hidden')) {
        chapterPreview.classList.remove('hidden');
        previewBookBtn.innerHTML = `
            <span class="material-symbols-outlined">visibility_off</span>
            <span>隐藏章节</span>
        `;

        // 滚动到章节预览区域
        chapterPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        chapterPreview.classList.add('hidden');
        previewBookBtn.innerHTML = `
            <span class="material-symbols-outlined">visibility</span>
            <span>预览章节</span>
        `;
    }
}

// 章节卡片点击事件
function initializeChapterCards() {
    const chapterCards = document.querySelectorAll('.chapter-card');

    chapterCards.forEach((card, index) => {
        card.addEventListener('click', function() {
            const chapterNumber = (index + 1).toString().padStart(2, '0');
            const chapterUrls = {
                '01': 'ebook/part1/chapter1/',
                '02': 'ebook/part1/chapter2/',
                '03': 'ebook/part2/chapter3/',
                '04': 'ebook/part2/chapter4/',
                '05': 'ebook/part2/chapter5/',
                '06': 'ebook/part3/chapter6/'
            };

            const targetUrl = chapterUrls[chapterNumber];
            if (targetUrl) {
                window.open(targetUrl, '_blank');
            } else {
                // 如果具体章节URL不存在，则打开电子书首页
                window.open('ebook/index.html', '_blank');
            }
        });
    });
}

// 快速总结按钮功能
function initializeQuickSummary() {
    const quickGuideBtn = document.getElementById('quickGuideBtn');
    if (quickGuideBtn) {
        quickGuideBtn.addEventListener('click', function() {
            openQuickSummaryModal();
        });
    }
}

// 打开快速总结模态框
function openQuickSummaryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'quickSummaryModal';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>电子书快速总结</h3>
                <button class="close-btn" onclick="closeModal(this.closest('.modal-overlay'))">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="modal-content">
                <div class="summary-sections">
                    <div class="summary-section">
                        <h4>🎯 核心要点</h4>
                        <ul>
                            <li>痤疮是毛囊皮脂腺的慢性炎症性疾病</li>
                            <li>治疗需要根据严重程度分级进行</li>
                            <li>日常护理与专业治疗相结合效果最佳</li>
                            <li>心理健康同样是治疗的重要组成部分</li>
                        </ul>
                    </div>

                    <div class="summary-section">
                        <h4>💡 治疗原则</h4>
                        <ul>
                            <li>轻度痤疮：外用药物治疗为主</li>
                            <li>中度痤疮：联合口服和外用药物</li>
                            <li>重度痤疮：需要系统性治疗</li>
                            <li>所有类型都需要配合正确护肤</li>
                        </ul>
                    </div>

                    <div class="summary-section">
                        <h4>🔬 关键概念</h4>
                        <ul>
                            <li>痤疮丙酸杆菌感染是重要诱因</li>
                            <li>激素水平变化影响皮脂分泌</li>
                            <li>正确的清洁和保湿是基础</li>
                            <li>防晒是预防和治疗的重要环节</li>
                        </ul>
                    </div>

                    <div class="summary-section">
                        <h4>📖 推荐阅读</h4>
                        <p>完整内容请阅读<a href="ebook/index.html" target="_blank">《专业痤疮治疗指南》</a>电子书</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    openModal(modal);
}

// 在页面加载完成后初始化章节卡片
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeChapterCards();
    initializeQuickSummary();
});