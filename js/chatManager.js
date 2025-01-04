class ChatManager {
    constructor() {
        this.currentMode = 'inquiry';  // inquiry, diagnosis, treatment
        this.inquiryHistory = [];
        this.diagnosisHistory = [];
        this.treatmentHistory = [];
        this.currentSystemPrompt = INQUIRY_PROMPT;
    }

    // 切换到问诊模式
    switchToInquiry() {
        this.currentMode = 'inquiry';
        this.currentSystemPrompt = INQUIRY_PROMPT;
    }

    // 切换到辨证模式
    switchToDiagnosis() {
        this.currentMode = 'diagnosis';
        this.currentSystemPrompt = DIAGNOSIS_PROMPT;
    }

    // 切换到治疗模式
    switchToTreatment() {
        this.currentMode = 'treatment';
        this.currentSystemPrompt = TREATMENT_PROMPT;
    }

    // 获取AI响应
    async getAIResponse(userMessage, onChunk) {
        if (!userMessage && this.currentMode === 'inquiry') {
            throw new Error('请输入您的症状描述');
        }

        const messages = this._buildChatRequest(userMessage);
        
        try {
            const response = await apiService.callDeepseekAPI(messages, onChunk);
            if (response) {
                this._updateHistory(userMessage, response);
            }
            return response;
        } catch (error) {
            console.error('获取AI响应时出错：', error);
            throw error;
        }
    }

    // 获取症状总结
    async getSummary() {
        if (this.inquiryHistory.length === 0) return '';

        const messages = this._buildSummaryRequest();
        
        try {
            const response = await apiService.callDeepseekAPI(messages);
            return response;
        } catch (error) {
            console.error('获取症状总结时出错：', error);
            throw error;
        }
    }

    // 获取辨证分析
    async getDiagnosisAnalysis(onChunk) {
        if (this.inquiryHistory.length === 0) {
            throw new Error('需要先进行问诊才能进行辨证分析');
        }

        const messages = this._buildDiagnosisRequest();
        
        try {
            const response = await apiService.callDeepseekAPI(messages, onChunk);
            if (response) {
                this.diagnosisHistory.push({
                    role: 'assistant',
                    content: response
                });
            }
            return response;
        } catch (error) {
            console.error('获取诊断分析时出错：', error);
            throw error;
        }
    }

    // 获取治疗方案
    async getTreatmentPlan(onChunk) {
        if (this.diagnosisHistory.length === 0) {
            throw new Error('需要先进行辨证分析才能制定治疗方案');
        }

        const messages = this._buildTreatmentRequest();
        
        try {
            const response = await apiService.callDeepseekAPI(messages, onChunk);
            if (response) {
                this.treatmentHistory.push({
                    role: 'assistant',
                    content: response
                });
            }
            return response;
        } catch (error) {
            console.error('获取治疗方案时出错：', error);
            throw error;
        }
    }

    // 构建聊天请求
    _buildChatRequest(userMessage) {
        const messages = [
            { role: 'system', content: this.currentSystemPrompt }
        ];

        // 添加历史对话
        if (this.currentMode === 'inquiry') {
            messages.push(...this.inquiryHistory);
        } else if (this.currentMode === 'diagnosis') {
            messages.push(...this.diagnosisHistory);
        } else {
            messages.push(...this.treatmentHistory);
        }

        // 添加用户消息
        if (userMessage) {
            messages.push({ role: 'user', content: userMessage });
        }

        return messages;
    }

    // 构建症状总结请求
    _buildSummaryRequest() {
        const messages = [
            { role: 'system', content: SUMMARY_PROMPT }
        ];

        // 添加问诊历史
        messages.push(...this.inquiryHistory);

        // 添加总结请求
        messages.push({
            role: 'user',
            content: '请总结以上问诊内容，列出主要症状、兼症、舌脉象等关键信息。'
        });

        return messages;
    }

    // 构建辨证请求
    _buildDiagnosisRequest() {
        const messages = [
            { role: 'system', content: DIAGNOSIS_PROMPT }
        ];

        // 添加问诊历史
        const relevantHistory = this.inquiryHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        messages.push(...relevantHistory);

        // 添加辨证请求
        messages.push({
            role: 'user',
            content: '请根据以上问诊内容进行中医辨证分析。'
        });

        return messages;
    }

    // 构建治疗方案请求
    _buildTreatmentRequest() {
        const messages = [
            { role: 'system', content: TREATMENT_PROMPT }
        ];

        // 添加辨证历史
        messages.push(...this.diagnosisHistory);

        // 添加治疗方案请求
        messages.push({
            role: 'user',
            content: '请根据以上辨证结果制定详细的治疗方案，包括治疗原则、方药选择、针灸方案等内容。'
        });

        return messages;
    }

    // 更新对话历史
    _updateHistory(userMessage, aiResponse) {
        if (!userMessage || !aiResponse) return;

        const messages = [
            { role: 'user', content: userMessage },
            { role: 'assistant', content: aiResponse }
        ];

        if (this.currentMode === 'inquiry') {
            this.inquiryHistory.push(...messages);
        } else if (this.currentMode === 'diagnosis') {
            this.diagnosisHistory.push(...messages);
        } else {
            this.treatmentHistory.push(...messages);
        }
    }

    // 清空历史记录
    clearHistory() {
        this.inquiryHistory = [];
        this.diagnosisHistory = [];
        this.treatmentHistory = [];
        this.switchToInquiry();
    }
}

const chatManager = new ChatManager(); 