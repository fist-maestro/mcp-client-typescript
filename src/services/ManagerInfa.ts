import { Tool } from '../common/types/tool.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPServerConfigs {
  [key: string]: MCPServerConfig;
}

export interface LLMProvider {
  setMCPClient(client: Client): void;
  processQuery(query: string, tools: Tool[]): Promise<string>;
  cleanup(): Promise<void>;
}

export interface MCPManager {
  loadServers(): Promise<void>;
  connectToServer(serverName: string): Promise<Tool[]>;
  processQuery(query: string): Promise<string>;
  cleanup(): Promise<void>;
} 