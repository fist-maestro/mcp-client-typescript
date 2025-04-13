import { Tool } from '../../common/types/tool.js';
import { LLMProvider } from '../ManagerInfa.js';
import { defaultDeepSeekConfig } from '../../common/config/llm-config/deepseek.js';
import { Logger } from '../../common/utils/logger.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { translateToolArguments } from '../../common/utils/cityNameMap.js';

export class DeepSeekService implements LLMProvider {
  private logger: Logger;
  private mcp: Client | null = null;

  constructor() {
    this.logger = new Logger();
  }

  setMCPClient(client: Client): void {
    this.mcp = client;
  }

  async processQuery(query: string, tools: Tool[]): Promise<string> {
    if (!this.mcp) {
      throw new Error('MCP client not set');
    }

    try {
      const response = await fetch(`${defaultDeepSeekConfig.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${defaultDeepSeekConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: defaultDeepSeekConfig.model,
          messages: [
            {
              role: 'system',
              content: '你是一个天气助手，可以帮助用户查询天气信息。请使用提供的工具来获取天气数据，并用中文自然语言回复用户。'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: defaultDeepSeekConfig.maxTokens,
          tools: tools.map(tool => ({
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.input_schema
            }
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 检查是否有工具调用
      if (data.choices[0].message.tool_calls) {
        const toolCalls = data.choices[0].message.tool_calls;
        this.logger.info(`[DeepSeek] 调用工具: ${toolCalls.map((t: any) => `weather服务的${t.function.name}`).join(', ')}`);
        
        // 执行所有工具调用
        const toolResults = await Promise.all(
          toolCalls.map(async (toolCall: any) => {
            if (!this.mcp) {
              throw new Error('MCP client not set');
            }
            // 转换参数中的城市名
            const args = JSON.parse(toolCall.function.arguments);
            const originalCity = args.city;  // 保存原始城市名
            const translatedArgs = translateToolArguments(args);
            if (originalCity !== translatedArgs.city) {
              this.logger.info(`[DeepSeek] 参数转换: ${originalCity} -> ${translatedArgs.city}`);
            }
            
            const result = await this.mcp.callTool({
              name: toolCall.function.name,
              arguments: translatedArgs
            });
            
            // 记录MCP server的返回结果
            this.logger.info(`[DeepSeek] weather服务的${toolCall.function.name}调用完成`);
            
            return {
              role: 'tool',
              content: JSON.stringify(result),
              tool_call_id: toolCall.id
            };
          })
        );

        // 发送第二次请求，包含工具调用结果
        const secondResponse = await fetch(`${defaultDeepSeekConfig.apiBase}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${defaultDeepSeekConfig.apiKey}`,
          },
          body: JSON.stringify({
            model: defaultDeepSeekConfig.model,
            messages: [
              {
                role: 'system',
                content: '你是一个天气助手，可以帮助用户查询天气信息。请使用提供的工具来获取天气数据，并用中文自然语言回复用户。'
              },
              {
                role: 'user',
                content: query
              },
              data.choices[0].message,
              ...toolResults
            ],
            max_tokens: defaultDeepSeekConfig.maxTokens
          }),
        });

        if (!secondResponse.ok) {
          throw new Error(`DeepSeek API error: ${secondResponse.statusText}`);
        }

        const secondData = await secondResponse.json();
        return secondData.choices[0].message.content;
      }

      return data.choices[0].message.content;
    } catch (error) {
      this.logger.error(`Error processing query with DeepSeek: ${error}`);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    this.logger.close();
  }
} 