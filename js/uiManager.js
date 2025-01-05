class UIManager {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentMessageDiv = null;
        this.userInfo = null;
        this.showUserInfoModal();
    }

    initializeElements() {
        // 用户信息相关元素
        this.userInfoModal = document.getElementById('userInfoModal');
        this.userNameInput = document.getElementById('userName');
        this.userAgeInput = document.getElementById('userAge');
        this.submitUserInfoBtn = document.getElementById('submitUserInfo');
        
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

        // 禁用主界面元素，直到用户信息录入完成
        this.disableMainInterface(true);
    }

    bindEvents() {
        // 用户信息提交
        this.submitUserInfoBtn.addEventListener('click', () => this.handleUserInfoSubmit());
        
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
    }

    checkUserInfo() {
        this.showUserInfoModal();
    }

    showUserInfoModal() {
        this.userInfoModal.style.display = 'block';
        // 清空表单
        this.userNameInput.value = '';
        this.userAgeInput.value = '';
        const genderInputs = document.querySelectorAll('input[name="gender"]');
        genderInputs.forEach(input => input.checked = false);
    }

    handleUserInfoSubmit() {
        const name = this.userNameInput.value.trim();
        const age = this.userAgeInput.value;
        const gender = document.querySelector('input[name="gender"]:checked')?.value;

        if (!name || !age || !gender) {
            alert('请填写完整的个人信息');
            return;
        }

        this.userInfo = { name, age, gender };
        this.userInfoModal.style.display = 'none';
        this.disableMainInterface(false);
        
        // 添加欢迎消息
        this.addMessage(`欢迎${name}${gender}士，我是您的智能中医问诊助手。请详细描述您的症状，我会仔细倾听并进行专业分析。`, false);
    }

    disableMainInterface(disabled) {
        this.userInput.disabled = disabled;
        this.sendBtn.disabled = disabled;
        this.switchModeBtn.disabled = disabled;
        this.clearBtn.disabled = disabled;
        this.exportBtn.disabled = disabled;
        this.printBtn.disabled = disabled;
        this.voiceInputBtn.disabled = disabled;
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
            // 显示用户信息表单
            this.showUserInfoModal();
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

    // 辅助方法：提取特定部分的内容
    _extractSection(text, sectionTitle) {
        const regex = new RegExp(`${sectionTitle}[：:](.*?)(?=(?:\\d+\\.|\\【|\\#|$))`, 's');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
    }

    // 辅助方法：格式化段落内容
    _formatSection(text) {
        if (!text) return '';
        
        // 移除多余的空行和空格
        text = text.replace(/\n{3,}/g, '\n\n')
            .replace(/^\s+|\s+$/g, '');

        // 保持原有格式，只处理基本的清理
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .join('\n');
    }

    // 导出聊天记录
    exportChatHistory() {
        try {
            const timestamp = new Date().toLocaleString();
            let content = '';
            
            // 添加标题和分隔线
            content += '=================================\n';
            content += '    冯氏中医智能问诊系统诊疗记录    \n';
            content += '=================================\n\n';
            
            // 添加基本信息
            content += '【基本信息】\n';
            content += '---------------------------------\n';
            content += `就诊时间：${timestamp}\n`;
            content += `患者姓名：${this.userInfo.name}\n`;
            content += `性    别：${this.userInfo.gender}\n`;
            content += `年    龄：${this.userInfo.age}岁\n\n`;
            
            // 添加问诊记录
            content += '【问诊记录】\n';
            content += '---------------------------------\n';
            const messages = Array.from(this.chatMessages.children);
            messages.forEach(msg => {
                const isUser = msg.classList.contains('user-message');
                const messageContent = msg.querySelector('.message-content') || msg;
                const text = messageContent.textContent || messageContent.innerText;
                content += `${isUser ? '患者' : '医生'}：${text}\n\n`;
            });
            
            // 添加辨证分析结果
            if (this.diagnosisSummary.innerHTML) {
                content += '【辨证分析】\n';
                content += '---------------------------------\n';
                const diagnosisText = this.diagnosisSummary.textContent || this.diagnosisSummary.innerText;
                content += diagnosisText + '\n\n';
            }
            
            // 添加治疗方案（如果有）
            if (chatManager.treatmentHistory && chatManager.treatmentHistory.length > 0) {
                content += '【治疗方案】\n';
                content += '---------------------------------\n';
                const treatmentContent = chatManager.treatmentHistory
                    .filter(msg => msg.role === 'assistant')
                    .map(msg => msg.content)
                    .join('\n\n');
                content += treatmentContent + '\n\n';
            }
            
            // 添加注意事项
            content += '【注意事项】\n';
            content += '---------------------------------\n';
            content += '1. 本记录由AI智能辅助系统生成，仅供参考\n';
            content += '2. 具体诊疗方案请遵医嘱\n';
            content += '3. 如有不适，请及时就医\n\n';
            
            // 添加页脚
            content += '=================================\n';
            content += '    冯氏中医智能问诊系统    \n';
            content += `    报告生成时间：${timestamp}    \n`;
            content += '=================================\n';

            // 创建文件名
            const fileName = `冯氏中医诊疗记录_${this.userInfo.name}_${timestamp.replace(/[/:]/g, '')}.txt`;

            // 检查是否为移动设备
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                // 移动设备：使用 Blob 和 Data URL
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                
                // 触发点击
                if (document.createEvent) {
                    const event = document.createEvent('MouseEvents');
                    event.initEvent('click', true, true);
                    link.dispatchEvent(event);
                } else {
                    link.click();
                }

                // 清理 URL
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 100);
            } else {
                // 桌面设备：使用传统方法
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            }
        } catch (error) {
            console.error('导出记录时出错：', error);
            alert('导出记录失败，请重试或联系技术支持。');
        }
    }

    // 打印诊断报告
    printDiagnosisReport() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>冯氏中医诊断报告</title>
                    <style>
                        body { font-family: "Microsoft YaHei", sans-serif; padding: 20px; }
                        h1 { text-align: center; color: #2c3e50; }
                        .section { margin: 20px 0; }
                        .section h2 { color: #34495e; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                        .content { line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <h1>冯氏中医诊断报告</h1>
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
            // 清空后显示用户信息表单
            this.showUserInfoModal();
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
}

const uiManager = new UIManager(); 