// chat-assistant.js - Claude API聊天助理
/**
 * 牙科诊所在线咨询助理 - Claude API集成
 */

// 聊天状态
let chatWidget = null;
let chatMessages = [];
let isTyping = false;
let currentUser = null;
let isVIPUser = false;

// Claude API配置
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// 内部FAQ数据库（RAG知识库）
const FAQ_DATABASE = [
    {
        id: 1,
        category: '服务项目',
        question: '你们提供哪些牙科服务？',
        keywords: ['服务', '项目', '治疗', '牙科'],
        answer: '我们提供全面的牙科服务，包括：一般家庭牙科（检查、洗牙、补牙）、美容牙科（美白、贴面、牙齿美容）、正畸治疗（牙套、隐形矫正）、根管治疗、牙周治疗、口腔修复、预防保健和口腔外科。每项服务都由我们经验丰富的专业医生团队提供。'
    },
    {
        id: 2,
        category: '门店位置',
        question: '你们有几个门店？都在哪里？',
        keywords: ['门店', '位置', '地址', '诊所'],
        answer: '我们在南加州有5个便民门店：Arcadia（65 N First Ave）、Rowland Heights（18888 Labin Ct）、Irvine（2222 Michelson Dr）、South Pasadena（1010 Mission St）和Eastvale（12505 Limonite Ave）。每个门店都配备先进设备和专业医疗团队。'
    },
    {
        id: 3,
        category: '营业时间',
        question: '营业时间是什么时候？',
        keywords: ['时间', '营业', '开门', '预约'],
        answer: '我们的营业时间是：周一至周五上午9点到下午5点，周末上午9点到下午2点。我们建议提前预约以确保能为您安排最合适的时间。紧急情况请致电我们，我们会尽力为您提供帮助。'
    },
    {
        id: 4,
        category: '费用保险',
        question: '你们接受保险吗？费用如何？',
        keywords: ['保险', '费用', '价格', '支付'],
        answer: '是的，我们接受大多数主要的牙科保险计划。具体费用因治疗项目而异，我们会在治疗前为您提供详细的费用估算。我们也提供多种支付方式和分期付款选项，让优质的牙科护理更加负担得起。'
    },
    {
        id: 5,
        category: '紧急情况',
        question: '如果有牙科紧急情况怎么办？',
        keywords: ['紧急', '急诊', '疼痛', '意外'],
        answer: '牙科紧急情况请立即联系我们。我们理解牙痛和牙科意外的紧迫性，会尽快为您安排就诊。在到达诊所前，您可以用冷敷缓解肿胀，用盐水漱口清洁，避免用患侧咀嚼。严重外伤请先到急诊室。'
    },
    {
        id: 6,
        category: '第一次就诊',
        question: '第一次来看牙需要准备什么？',
        keywords: ['第一次', '新患者', '准备', '带什么'],
        answer: '第一次就诊请携带：有效身份证件、保险卡、当前服用的药物清单、以前的牙科X光片（如有）。建议提前15分钟到达以完成注册手续。我们会为您进行全面的口腔检查并制定个性化的治疗计划。'
    },
    {
        id: 7,
        category: '儿童牙科',
        question: '你们看儿童患者吗？',
        keywords: ['儿童', '小孩', '孩子', '婴幼儿'],
        answer: '是的，我们欢迎各个年龄段的患者，包括儿童。我们的医生在儿童牙科方面经验丰富，诊所环境温馨友好。我们建议孩子在第一颗牙齿萌出后或1岁生日时进行第一次牙科检查。我们致力于让每个小患者都有积极的看牙体验。'
    },
    {
        id: 8,
        category: '预约取消',
        question: '如何取消或修改预约？',
        keywords: ['取消', '修改', '更改', '预约'],
        answer: '您可以通过我们的在线预约系统、电话或直接联系诊所来取消或修改预约。为了避免取消费用，请至少提前24小时通知我们。我们理解计划可能会有变化，会尽力为您重新安排合适的时间。'
    }
];

/**
 * 初始化聊天助理
 * @param {Object} user - 当前用户对象
 * @param {boolean} isVIP - 是否为VIP用户
 */
// 导出初始化函数
export function initializeChatAssistant(user, isVIP = false) {
    console.log('=== initializeChatAssistant START ===');
    currentUser = user;
    isVIPUser = isVIP;
    
    if (isVIP) {
        console.log('User is VIP, chat overlay ready');
        // 不立即创建，等用户点击时再创建
    } else {
        console.log('User is not VIP');
    }
};

/**
 * 显示聊天窗口
 */
function showChatWindow() {
    if (!chatWidget) return;
    
    const chatWindow = chatWidget.querySelector('#chat-window');
    const chatToggle = chatWidget.querySelector('#chat-toggle');
    
    chatWindow.style.display = 'flex';
    chatToggle.classList.add('active');
    
    // 聚焦到输入框
    setTimeout(() => {
        const chatInput = chatWidget.querySelector('#chat-input');
        chatInput?.focus();
    }, 100);
    
    // 清除通知点
    const notificationDot = chatWidget.querySelector('#notification-dot');
    if (notificationDot) {
        notificationDot.style.display = 'none';
    }
}

/**
 * 隐藏聊天窗口
 */
function hideChatWindow() {
    if (!chatWidget) return;
    
    const chatWindow = chatWidget.querySelector('#chat-window');
    const chatToggle = chatWidget.querySelector('#chat-toggle');
    
    chatWindow.style.display = 'none';
    chatToggle.classList.remove('active');
}

/**
 * 处理输入变化
 */
function handleInputChange(e) {
    const sendBtn = chatWidget.querySelector('#send-message');
    const hasContent = e.target.value.trim().length > 0;
    
    sendBtn.disabled = !hasContent;
    
    // 自动调整文本框高度
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
}

/**
 * 处理键盘事件
 */
function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

/**
 * 发送消息
 */
async function sendMessage() {
    if (isTyping) return;
    
    const chatInput = chatWidget.querySelector('#chat-input');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // 添加用户消息到界面
    addMessageToChat('user', message);
    
    // 清空输入框
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatWidget.querySelector('#send-message').disabled = true;
    
    // 显示typing指示器
    showTypingIndicator();
    
    try {
        // 获取助理回复
        const response = await getAssistantResponse(message);
        
        // 隐藏typing指示器并添加助理回复
        hideTypingIndicator();
        addMessageToChat('assistant', response);
        
    } catch (error) {
        console.error('Error getting assistant response:', error);
        hideTypingIndicator();
        
        const errorMessage = currentLanguage === 'zh' ? 
            '抱歉，我暂时无法回答您的问题。请稍后重试或直接联系我们的前台。' :
            'Sorry, I\'m unable to answer your question right now. Please try again later or contact our front desk directly.';
            
        addMessageToChat('assistant', errorMessage, true);
    }
}

/**
 * 添加消息到聊天界面
 * @param {string} sender - 'user' 或 'assistant'
 * @param {string} message - 消息内容
 * @param {boolean} isError - 是否为错误消息
 */
function addMessageToChat(sender, message, isError = false) {
    const chatMessages = chatWidget.querySelector('#chat-messages');
    const messageEl = document.createElement('div');
    
    messageEl.className = `message ${sender}-message ${isError ? 'error' : ''}`;
    
    if (sender === 'user') {
        messageEl.innerHTML = `
            <div class="message-content user-content">
                <p>${escapeHtml(message)}</p>
            </div>
            <div class="user-avatar">
                <i class="fas fa-user"></i>
            </div>
        `;
    } else {
        messageEl.innerHTML = `
            <div class="assistant-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content assistant-content">
                <p>${escapeHtml(message)}</p>
                <div class="message-time">
                    ${new Date().toLocaleTimeString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </div>
        `;
    }
    
    // 移除欢迎消息（如果是第一条真实消息）
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage && chatMessages.children.length === 1) {
        welcomeMessage.remove();
    }
    
    chatMessages.appendChild(messageEl);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 添加到消息历史
    chatMessages.push({
        sender,
        message,
        timestamp: new Date().toISOString(),
        isError
    });
}

/**
 * 显示typing指示器
 */
function showTypingIndicator() {
    isTyping = true;
    const typingIndicator = chatWidget.querySelector('#typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'flex';
    }
    
    // 滚动到底部
    const chatMessages = chatWidget.querySelector('#chat-messages');
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

/**
 * 隐藏typing指示器
 */
function hideTypingIndicator() {
    isTyping = false;
    const typingIndicator = chatWidget.querySelector('#typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

/**
 * 处理快速问题
 * @param {string} questionType - 问题类型
 */
function handleQuickQuestion(questionType) {
    let question;
    
    switch (questionType) {
        case 'services':
            question = currentLanguage === 'zh' ? '你们提供哪些牙科服务？' : 'What dental services do you provide?';
            break;
        case 'location':
            question = currentLanguage === 'zh' ? '你们有几个门店？都在哪里？' : 'How many locations do you have and where are they?';
            break;
        case 'hours':
            question = currentLanguage === 'zh' ? '营业时间是什么时候？' : 'What are your business hours?';
            break;
        default:
            return;
    }
    
    // 设置输入框内容并发送
    const chatInput = chatWidget.querySelector('#chat-input');
    chatInput.value = question;
    sendMessage();
}

/**
 * 获取助理回复（集成Claude API和RAG）
 * @param {string} userMessage - 用户消息
 * @returns {Promise<string>} 助理回复
 */
async function getAssistantResponse(userMessage) {
    try {
        // 首先尝试从内部FAQ数据库中匹配答案
        const ragResponse = searchFAQDatabase(userMessage);
        
        let systemPrompt;
        if (ragResponse) {
            // 找到了匹配的FAQ，让Claude基于这个信息回答
            systemPrompt = `你是First Ave Dental & Orthodontics的专业牙科咨询助理。你正在为VIP客户提供服务。

根据我们内部的FAQ数据库，我找到了与用户问题相关的信息：

${ragResponse}

请基于这个信息，用${currentLanguage === 'zh' ? '中文' : '英语'}为用户提供准确、友好、专业的回答。如果用户的问题不能完全通过这个信息回答，请诚实地说明，并建议他们联系前台获取更详细的信息。

注意事项：
- 保持友好和专业的语调
- 不要提供具体的医疗诊断或治疗建议
- 如果涉及复杂的医疗问题，建议用户咨询我们的牙医
- 强调我们的专业性和对患者的关怀`;
        } else {
            // 没有找到匹配的FAQ，使用通用的系统提示
            systemPrompt = `你是First Ave Dental & Orthodontics的专业牙科咨询助理。你正在为VIP客户提供服务。

请用${currentLanguage === 'zh' ? '中文' : '英语'}回答用户的问题。你可以提供以下方面的信息：
- 一般牙科服务介绍（检查、洗牙、美容、正畸等）
- 预约流程和注意事项
- 术后护理建议
- 口腔健康常识

重要限制：
- 不要提供具体的医疗诊断
- 不要推荐具体的治疗方案
- 对于复杂的医疗问题，建议用户咨询我们的专业牙医
- 如果不确定答案，诚实地说明并建议联系前台

保持友好、专业、有帮助的语调。`;
        }
        
        // 调用Claude API
        const response = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: CLAUDE_MODEL,
                max_tokens: 1000,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.content[0].text;
        
    } catch (error) {
        console.error('Error calling Claude API:', error);
        throw error;
    }
}

/**
 * 在FAQ数据库中搜索匹配的答案
 * @param {string} userMessage - 用户消息
 * @returns {string|null} 匹配的FAQ答案或null
 */
function searchFAQDatabase(userMessage) {
    const userMessageLower = userMessage.toLowerCase();
    const matchedFAQs = [];
    
    FAQ_DATABASE.forEach(faq => {
        let matchScore = 0;
        
        // 检查关键词匹配
        faq.keywords.forEach(keyword => {
            if (userMessageLower.includes(keyword.toLowerCase())) {
                matchScore += 2;
            }
        });
        
        // 检查问题文本匹配
        if (userMessageLower.includes(faq.question.toLowerCase().substring(0, 10))) {
            matchScore += 3;
        }
        
        // 简单的文本相似性检查
        const questionWords = faq.question.toLowerCase().split('');
        const userWords = userMessageLower.split('');
        const commonWords = questionWords.filter(word => userWords.includes(word));
        matchScore += commonWords.length * 0.5;
        
        if (matchScore > 1) {
            matchedFAQs.push({
                faq,
                score: matchScore
            });
        }
    });
    
    // 返回最匹配的FAQ
    if (matchedFAQs.length > 0) {
        matchedFAQs.sort((a, b) => b.score - a.score);
        const bestMatch = matchedFAQs[0];
        
        return `分类：${bestMatch.faq.category}\n问题：${bestMatch.faq.question}\n答案：${bestMatch.faq.answer}`;
    }
    
    return null;
}

/**
 * HTML转义函数
 * @param {string} text - 要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


/**
 * 创建左右分布的聊天界面 - 左侧毛玻璃对话框，右侧保持预约界面
 */
function createChatOverlay() {
    console.log('=== Creating left-right chat overlay ===');
    
    // 避免重复创建
    if (chatWidget) {
        console.log('Chat overlay already exists');
        return;
    }
    
    chatWidget = document.createElement('div');
    chatWidget.className = 'chat-overlay-container';
    chatWidget.innerHTML = `
        <!-- 左侧毛玻璃对话区域 -->
        <div class="chat-overlay-left">
            <div class="chat-overlay-header">
                <div class="chat-title">
                    <span>Sunnie</span>
                </div>
                <button class="chat-close-btn" id="close-chat-overlay">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="chat-messages-area" id="chat-messages">
                <div class="welcome-message">
                    <div class="message-content">
                        <p>${currentLanguage === 'zh' ? 
                            '您好！我是您的专属牙科咨询助理。我可以帮助您了解我们的服务、选择合适的治疗方案。您可以边咨询边在右侧直接预约。' :
                            'Hello! I\'m your dedicated dental consultation assistant. I can help you understand our services and choose the right treatment. You can consult with me while booking directly on the right side.'
                        }</p>
                    </div>
                </div>
            </div>
            
            <div class="typing-indicator" id="typing-indicator" style="display: none;">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span class="typing-text">${currentLanguage === 'zh' ? '助理正在输入...' : 'Assistant is typing...'}</span>
            </div>
            
            <div class="chat-input-area">
                <div class="chat-input-container">
                    <textarea id="chat-input" placeholder="${currentLanguage === 'zh' ? '询问服务类型、治疗建议...' : 'Ask about services, treatment advice...'}" 
                             rows="1"></textarea>
                    <button id="send-message" class="send-btn" disabled>
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- 右侧预约界面保持可见 - 不需要额外HTML，原有界面自然显示 -->
    `;
    
    document.body.appendChild(chatWidget);
    bindChatOverlayEvents();
    console.log('Chat overlay created and appended');
}

/**
 * 显示左右分布的聊天界面
 */
export function showChatAssistant() {
    console.log('=== showChatAssistant called ===');
    console.log('chatWidget exists:', !!chatWidget);
    console.log('isVIPUser:', isVIPUser);
    
    if (!chatWidget) {
        console.log('Creating chat overlay...');
        createChatOverlay();
    }
    
    if (chatWidget && isVIPUser) {
        console.log('Making chat overlay visible...');
        chatWidget.style.display = 'flex';
        
        // 聚焦到输入框
        setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            chatInput?.focus();
        }, 100);
        
        console.log('Chat overlay should now be visible');
    } else {
        console.log('Cannot show overlay - missing chatWidget or not VIP');
    }
}

/**
 * 隐藏聊天助理
 */
export function hideChatAssistant() {
    if (chatWidget) {
        chatWidget.style.display = 'none';
    }
}

/**
 * 绑定聊天界面事件
 */
function bindChatOverlayEvents() {
    if (!chatWidget) return;
    
    // 关闭按钮
    const closeBtn = chatWidget.querySelector('#close-chat-overlay');
    closeBtn?.addEventListener('click', hideChatAssistant);
    
    // 消息输入
    const chatInput = chatWidget.querySelector('#chat-input');
    const sendBtn = chatWidget.querySelector('#send-message');
    
    chatInput?.addEventListener('input', handleInputChange);
    chatInput?.addEventListener('keydown', handleInputKeydown);
    sendBtn?.addEventListener('click', sendMessage);
    
    // 快速问题按钮
    const quickButtons = chatWidget.querySelectorAll('.quick-btn');
    quickButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const questionType = e.target.dataset.question;
            handleQuickQuestion(questionType);
        });
    });
}

/**
 * 销毁聊天助理
 */
export function destroyChatAssistant() {
    if (chatWidget) {
        chatWidget.remove();
        chatWidget = null;
    }
    
    chatMessages = [];
    isTyping = false;
    currentUser = null;
    isVIPUser = false;
}

/**
 * 检查聊天助理是否可用
 * @returns {boolean} 是否可用
 */
export function isChatAssistantAvailable() {
    return currentUser && isVIPUser;
}

/**
 * 获取聊天历史
 * @returns {Array} 聊天消息数组
 */
export function getChatHistory() {
    return [...chatMessages];
}

/**
 * 清除聊天历史
 */
export function clearChatHistory() {
    chatMessages = [];
    
    if (chatWidget) {
        const chatMessagesEl = chatWidget.querySelector('#chat-messages');
        if (chatMessagesEl) {
            chatMessagesEl.innerHTML = `
                <div class="welcome-message">
                    <div class="assistant-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-content">
                        <p>${currentLanguage === 'zh' ? 
                            '您好！我是您的专属牙科咨询助理。有什么问题请随时询问！' :
                            'Hello! I\'m your dedicated dental consultation assistant. Feel free to ask me anything!'
                        }</p>
                    </div>
                </div>
            `;
        }
    }
}