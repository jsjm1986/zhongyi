class ApiService {
    constructor() {
        // API配置
        this.API_KEY = ''; // 需要用户在初始化时设置
        this.API_URL = 'https://api.deepseek.com/v1/chat/completions';
        this.config = API_CONFIG;
    }

    // 设置API密钥
    setApiKey(apiKey) {
        this.API_KEY = apiKey;
    }

    // 检查API密钥是否已设置
    checkApiKey() {
        if (!this.API_KEY) {
            throw new Error('请先设置API密钥');
        }
    }

    // 调用Deepseek API
    async callDeepseekAPI(messages, onChunk) {
        try {
            // 检查API密钥
            this.checkApiKey();

            // 准备请求参数
            const requestBody = {
                model: this.config.model,
                messages: messages,
                temperature: this.config.temperature,
                max_tokens: this.config.max_tokens,
                top_p: this.config.top_p,
                frequency_penalty: this.config.frequency_penalty,
                presence_penalty: this.config.presence_penalty,
                stream: true
            };

            // 发送请求
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`
                },
                body: JSON.stringify(requestBody)
            });

            // 检查响应状态
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('API密钥无效或未授权');
                }
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API请求失败: ${response.status} ${response.statusText}`);
            }

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let content = '';

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        if (jsonStr === '[DONE]') continue;
                        
                        try {
                            const jsonData = JSON.parse(jsonStr);
                            const delta = jsonData.choices[0]?.delta?.content || '';
                            content += delta;
                            
                            // 触发进度更新回调
                            if (onChunk) {
                                onChunk(delta);
                            }
                        } catch (e) {
                            console.warn('解析响应数据出错:', e);
                        }
                    }
                }
            }

            return content;

        } catch (error) {
            console.error('API调用错误:', error);
            throw error;
        }
    }
}

// 创建全局实例
window.apiService = new ApiService(); 