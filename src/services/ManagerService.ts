import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Tool } from '../common/types/tool.js';
import fs from 'fs/promises';
import path from 'path';
import { MCPManager, MCPServerConfigs, LLMProvider } from './ManagerInfa.js';
import { DeepSeekService } from './llm-providers/DeepSeekService.js';
import { AnthropicService } from './llm-providers/AnthropicService.js';
import { Logger } from '../common/utils/logger.js';
import { translateToolArguments } from '../common/utils/cityNameMap.js';

export class ManagerService implements MCPManager {
  private mcp: Client;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];
  private llmProvider: LLMProvider;
  private logger: Logger;
  private serverConfigs: MCPServerConfigs = {};

  constructor(provider: string = 'deepseek') {
    this.mcp = new Client({ name: 'mcp-client-cli', version: '1.0.0' });
    
    // 根据provider参数选择LLM服务商
    switch (provider.toLowerCase()) {
      case 'deepseek':
        this.llmProvider = new DeepSeekService();
        break;
      case 'anthropic':
        this.llmProvider = new AnthropicService();
        break;
      default:
        throw new Error(`不支持的LLM服务商: ${provider}`);
    }
    
    this.llmProvider.setMCPClient(this.mcp);
    this.logger = new Logger();
  }

  /**
   * 获取所有已加载的服务器名称
   * @returns 服务器名称数组
   */
  getServerNames(): string[] {
    return Object.keys(this.serverConfigs);
  }

  async loadServers(): Promise<void> {
    try {
      const configDir = path.join(process.cwd(), 'src/common/config/mcp-servers-config');
      const files = await fs.readdir(configDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const configContent = await fs.readFile(path.join(configDir, file), 'utf-8');
          const config = JSON.parse(configContent);
          this.serverConfigs = { ...this.serverConfigs, ...config };
        }
      }
      
      this.logger.info(`Loaded server configs: ${Object.keys(this.serverConfigs).join(', ')}`);
    } catch (error) {
      this.logger.error(`Error loading server configs: ${error}`);
      throw error;
    }
  }

  async connectToServer(serverName: string): Promise<Tool[]> {
    try {
      const config = this.serverConfigs[serverName];
      if (!config) {
        throw new Error(`Server configuration not found for: ${serverName}`);
      }

      this.transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env,
      });

      this.mcp.connect(this.transport);
      
      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => ({
        name: tool.name,
        description: tool.description || '无描述',
        input_schema: tool.inputSchema,
      }));

      this.logger.info(`Connected to server ${serverName} with tools: ${this.tools.map(t => t.name).join(', ')}`);
      return this.tools;
    } catch (error) {
      this.logger.error(`Error connecting to server ${serverName}: ${error}`);
      throw error;
    }
  }

  private async callTool(name: string, args: any): Promise<any> {
    try {
      // 转换参数中的城市名
      const translatedArgs = translateToolArguments(args);
      this.logger.info(`Calling tool ${name} with translated arguments: ${JSON.stringify(translatedArgs)}`);

      const result = await this.mcp.callTool({
        name,
        arguments: translatedArgs
      });
      
      // 记录MCP server的返回结果
      this.logger.info(`Tool ${name} response: ${JSON.stringify(result.content)}`);
      
      return result.content;
    } catch (error) {
      this.logger.error(`Error calling tool ${name}: ${error}`);
      throw error;
    }
  }

  async processQuery(query: string): Promise<string> {
    try {
      const response = await this.llmProvider.processQuery(query, this.tools);
      this.logger.info(`Processed query: ${query}`);
      return response;
    } catch (error) {
      this.logger.error(`Error processing query: ${error}`);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.transport) {
      await this.mcp.close();
    }
    this.logger.close();
  }

  setLLMProvider(provider: LLMProvider): void {
    this.llmProvider = provider;
    this.llmProvider.setMCPClient(this.mcp);
  }
} 