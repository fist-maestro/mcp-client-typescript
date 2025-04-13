export interface AnthropicConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

export const defaultAnthropicConfig: AnthropicConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  model: 'claude-3-sonnet-20240229',
  maxTokens: 1000
}; 