class UIManager {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentMessageDiv = null;
        
        // 初始化时检查API密钥
        this.checkApiKey();
    }

    initializeElements() {
        // 基本元素
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        
        // 诊断分析面板
        this.diagnosisSummary = document.getElementById('diagnosisSummary');
        
        // 控制按钮和指示器
        this.switchModeBtn = document.getElementById('switchModeBtn');
        this.modeIndicator = document.querySelector('.mode-indicator');
        this.clearBtn = document.getElementById('clearBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.printBtn = document.getElementById('printBtn');
        this.voiceInputBtn = document.getElementById('voiceInputBtn');
        
        // 模态框
        this.helpBtn = document.getElementById('helpBtn');
        this.aboutBtn = document.getElementById('aboutBtn');
        this.helpModal = document.getElementById('helpModal');
        this.aboutModal = document.getElementById('aboutModal');
        this.closeButtons = document.querySelectorAll('.close-btn');

        // API密钥相关元素
        this.apiKeyModal = document.getElementById('apiKeyModal');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.setApiKeyBtn = document.getElementById('setApiKeyBtn');
    }

    bindEvents() {
        // 基本交互
        this.sendBtn.addEventListener('click', () => this.handleUserInput());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleUserInput();
            }
        });

        // 模式切换
        this.switchModeBtn.addEventListener('click', () => this.switchMode());
        
        // 清空历史
        this.clearBtn.addEventListener('click', () => this.clearHistory());
        
        // 导出功能
        this.exportBtn.addEventListener('click', () => this.exportChatHistory());
        
        // 打印功能
        this.printBtn.addEventListener('click', () => this.printDiagnosisReport());
        
        // 语音输入
        if (this.voiceInputBtn) {
            this.voiceInputBtn.addEventListener('click', () => this.startVoiceInput());
        }

        // 模态框
        this.helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showModal(this.helpModal);
        });

        this.aboutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showModal(this.aboutModal);
        });

        this.closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal(btn.closest('.modal'));
            });
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // API密钥按钮事件
        if (this.setApiKeyBtn) {
            this.setApiKeyBtn.addEventListener('click', () => this.setApiKey());
        }
    }

    // 显示模态框
    showModal(modal) {
        modal.style.display = 'block';
    }

    // 关闭模态框
    closeModal(modal) {
        modal.style.display = 'none';
    }

    // 切换模式
    switchMode() {
        if (chatManager.currentMode === 'inquiry') {
            // 从问诊模式切换到辨证模式
            chatManager.switchToDiagnosis();
            this.switchModeBtn.innerHTML = '<i class="fas fa-prescription"></i> 进行治疗分析';
            this.modeIndicator.innerHTML = '<i class="fas fa-clipboard-check"></i> 当前模式：辨证分析';
            this.userInput.placeholder = '请输入补充信息或直接点击发送获取辨证分析...';
            // 自动触发辨证分析
            this.handleDiagnosisAnalysis();
        } else if (chatManager.currentMode === 'diagnosis') {
            // 从辨证模式切换到治疗模式
            chatManager.switchToTreatment();
            this.switchModeBtn.innerHTML = '<i class="fas fa-user-md"></i> 返回问诊';
            this.modeIndicator.innerHTML = '<i class="fas fa-prescription"></i> 当前模式：治疗方案';
            this.userInput.placeholder = '请输入补充信息或直接点击发送获取治疗方案...';
            // 自动触发治疗方案制定
            this.handleTreatmentPlan();
        } else {
            // 从治疗模式返回问诊模式
            chatManager.switchToInquiry();
            this.switchModeBtn.innerHTML = '<i class="fas fa-notes-medical"></i> 进行辨证分析';
            this.modeIndicator.innerHTML = '<i class="fas fa-user-md"></i> 当前模式：问诊';
            this.userInput.placeholder = '请描述您的症状...';
        }
    }

    async handleDiagnosisAnalysis() {
        this.setLoading(true);
        try {
            // 创建空的AI消息容器
            this.addMessage('正在进行辨证分析...', false);
            
            // 获取辨证分析结果
            const analysis = await chatManager.getDiagnosisAnalysis(
                (chunk) => this.updateCurrentMessage(chunk)
            );
            
            if (analysis) {
                this.diagnosisSummary.innerHTML = analysis;
            }
            
        } catch (error) {
            console.error('辨证分析出错：', error);
            this.updateCurrentMessage(error.message || UI_CONFIG.errorMessage);
        } finally {
            this.setLoading(false);
        }
    }

    // 导出聊天记录
    exportChatHistory() {
        const history = {
            chat: Array.from(this.chatMessages.children).map(msg => ({
                type: msg.classList.contains('user-message') ? 'user' : 'ai',
                content: msg.textContent
            }))
        };

        const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `中医问诊记录_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 打印诊断报告
    printDiagnosisReport() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>中医诊断报告</title>
                    <style>
                        body { font-family: "Microsoft YaHei", sans-serif; padding: 20px; }
                        h1 { text-align: center; color: #2c3e50; }
                        .section { margin: 20px 0; }
                        .section h2 { color: #34495e; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                        .content { line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <h1>中医诊断报告</h1>
                    <div class="section">
                        <h2>诊断内容</h2>
                        <div class="content">${this.diagnosisSummary.innerHTML}</div>
                    </div>
                    <footer style="margin-top: 40px; text-align: center; color: #666;">
                        <p>报告生成时间：${new Date().toLocaleString()}</p>
                        <p>注意：本报告仅供参考，具体诊疗请遵医嘱</p>
                    </footer>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // 清空历史记录
    clearHistory() {
        if (confirm('确定要清空所有对话历史吗？')) {
            this.chatMessages.innerHTML = '';
            this.diagnosisSummary.innerHTML = '';
            chatManager.clearHistory();
        }
    }

    // 语音输入功能
    async startVoiceInput() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('您的浏览器不支持语音输入功能');
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';

        recognition.onstart = () => {
            this.voiceInputBtn.classList.add('recording');
            this.voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        };

        recognition.onend = () => {
            this.voiceInputBtn.classList.remove('recording');
            this.voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.userInput.value = transcript;
        };

        recognition.start();
    }

    addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        if (isUser) {
            messageDiv.textContent = content;
        } else {
            const formattedContent = document.createElement('div');
            formattedContent.className = 'formatted-content';
            formattedContent.innerHTML = content ? content.replace(/\n/g, '<br>') : '';
            messageDiv.appendChild(formattedContent);
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        if (!isUser) {
            this.currentMessageDiv = messageDiv;
        }
    }

    updateCurrentMessage(chunk) {
        if (this.currentMessageDiv) {
            const formattedContent = this.currentMessageDiv.querySelector('.formatted-content');
            if (formattedContent) {
                formattedContent.innerHTML = formattedContent.innerHTML + (chunk ? chunk.replace(/\n/g, '<br>') : '');
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }
        }
    }

    setLoading(isLoading) {
        this.sendBtn.disabled = isLoading;
        this.sendBtn.innerHTML = isLoading ? 
            '<i class="fas fa-spinner fa-spin"></i> 思考中...' : 
            '<i class="fas fa-paper-plane"></i> 发送';
        this.switchModeBtn.disabled = isLoading;
    }

    async handleUserInput() {
        const userMessage = this.userInput.value.trim();
        if (!userMessage && chatManager.currentMode === 'inquiry') {
            alert('请输入您的症状描述');
            return;
        }

        if (userMessage) {
            this.addMessage(userMessage, true);
        }
        this.userInput.value = '';
        this.setLoading(true);

        try {
            if (chatManager.currentMode === 'diagnosis' && !userMessage) {
                // 直接获取辨证分析
                await this.handleDiagnosisAnalysis();
            } else if (chatManager.currentMode === 'treatment' && !userMessage) {
                // 直接获取治疗方案
                await this.handleTreatmentPlan();
            } else {
                // 创建空的AI消息容器
                this.addMessage('', false);
                
                // 使用流式输出
                await chatManager.getAIResponse(userMessage, 
                    (chunk) => this.updateCurrentMessage(chunk));
            }
        } catch (error) {
            console.error('处理用户输入时出错：', error);
            this.updateCurrentMessage(error.message || '抱歉，系统出现了错误，请稍后重试。');
        } finally {
            this.setLoading(false);
        }
    }

    // 处理治疗方案
    async handleTreatmentPlan() {
        this.setLoading(true);
        try {
            // 创建空的AI消息容器
            this.addMessage('正在制定治疗方案...', false);
            
            // 获取治疗方案
            const treatment = await chatManager.getTreatmentPlan(
                (chunk) => this.updateCurrentMessage(chunk)
            );
            
            if (treatment) {
                this.diagnosisSummary.innerHTML = treatment;
            }
            
        } catch (error) {
            this.updateCurrentMessage(UI_CONFIG.errorMessage);
        } finally {
            this.setLoading(false);
        }
    }

    // 检查API密钥
    checkApiKey() {
        const apiKey = localStorage.getItem('deepseek_api_key');
        if (!apiKey) {
            this.showApiKeyModal();
        } else {
            window.apiService.setApiKey(apiKey);
        }
    }

    // 显示API密钥输入框
    showApiKeyModal() {
        const modal = document.getElementById('apiKeyModal');
        modal.style.display = 'block';
    }

    // 设置API密钥
    setApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            alert('请输入有效的API密钥');
            return;
        }

        // 保存API密钥
        localStorage.setItem('deepseek_api_key', apiKey);
        window.apiService.setApiKey(apiKey);

        // 关闭模态框
        const modal = document.getElementById('apiKeyModal');
        modal.style.display = 'none';
    }
}

const uiManager = new UIManager(); 