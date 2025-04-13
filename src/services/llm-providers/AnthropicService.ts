import { Anthropic } from '@anthropic-ai/sdk';
import { Tool } from '../../common/types/tool.js';
import { LLMProvider } from '../ManagerInfa.js';
import { defaultAnthropicConfig } from '../../common/config/llm-config/anthropic.js';
import { Logger } from '../../common/utils/logger.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { translateToolArguments } from '../../common/utils/cityNameMap.js';

export class AnthropicService implements LLMProvider {
  private anthropic: Anthropic;
  private logger: Logger;
  private mcp: Client | null = null;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: defaultAnthropicConfig.apiKey,
    });
    this.logger = new Logger();
  }

  setMCPClient(client: Client): void {
    this.mcp = client;
  }

  async processQuery(query: string, tools: Tool[]): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: defaultAnthropicConfig.model,
        max_tokens: defaultAnthropicConfig.maxTokens,
        messages: [{ role: 'user', content: query }],
        system: "你是一个天气助手，可以帮助用户查询天气信息。请使用提供的工具来获取天气数据，并用中文自然语言回复用户。"
      });

      // 检查是否有工具调用
      const toolCallsContent = response.content.find(c => 'tool_calls' in c) as any;
      if (toolCallsContent?.tool_calls) {
        const toolCalls = toolCallsContent.tool_calls;
        this.logger.info(`[Anthropic] 调用工具: ${toolCalls.map((t: any) => `weather服务的${t.function.name}`).join(', ')}`);
        
        // 执行所有工具调用
        const toolResults = await Promise.all(
          toolCalls.map(async (toolCall: any) => {
            if (!this.mcp) {
              throw new Error('MCP client not set');
            }
            const args = JSON.parse(toolCall.function.arguments);
            const originalCity = args.city;  // 保存原始城市名
            const translatedArgs = translateToolArguments(args);
            if (originalCity !== translatedArgs.city) {
              this.logger.info(`[Anthropic] 参数转换: ${originalCity} -> ${translatedArgs.city}`);
            }
            
            const result = await this.mcp.callTool({
              name: toolCall.function.name,
              arguments: translatedArgs
            });
            
            // 记录MCP server的返回结果
            this.logger.info(`[Anthropic] weather服务的${toolCall.function.name}调用完成`);
            
            return {
              role: 'tool',
              content: JSON.stringify(result),
              tool_call_id: toolCall.id
            };
          })
        );

        // 发送第二次请求，包含工具调用结果
        const secondResponse = await this.anthropic.messages.create({
          model: defaultAnthropicConfig.model,
          max_tokens: defaultAnthropicConfig.maxTokens,
          messages: [
            { role: 'user', content: query },
            ...toolResults
          ],
          system: "你是一个天气助手，可以帮助用户查询天气信息。请使用提供的工具来获取天气数据，并用中文自然语言回复用户。"
        });

        return secondResponse.content[0].text;
      }

      return response.content[0].text;
    } catch (error) {
      this.logger.error(`Error processing query with Anthropic: ${error}`);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    this.logger.close();
  }
} 