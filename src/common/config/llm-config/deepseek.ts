export interface DeepSeekConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  apiBase: string;
}

export const defaultDeepSeekConfig: DeepSeekConfig = {
  apiKey: '此处填写你的API Key',
  model: 'deepseek-chat',
  maxTokens: 2048,
  apiBase: 'https://api.deepseek.com/v1'
}; 