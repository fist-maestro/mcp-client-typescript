import readline from 'readline/promises';
import { ManagerService } from '../services/ManagerService.js';
import { Logger } from '../common/utils/logger.js';

export class ChatController {
  private manager: ManagerService;
  private logger: Logger;

  constructor(provider: string = 'deepseek') {
    this.manager = new ManagerService(provider);
    this.logger = new Logger();
  }

  async initialize(): Promise<void> {
    try {
      await this.manager.loadServers();
      
      // 获取所有已加载的服务器名称
      const serverNames = this.manager.getServerNames();
      this.logger.info(`Found servers: ${serverNames.join(', ')}`);
      
      // 连接所有服务器
      for (const serverName of serverNames) {
        try {
          await this.manager.connectToServer(serverName);
          this.logger.info(`Successfully connected to server: ${serverName}`);
        } catch (error) {
          this.logger.error(`Failed to connect to server ${serverName}: ${error}`);
          // 继续尝试连接其他服务器，而不是直接失败
        }
      }
      
      this.logger.info('Chat controller initialized successfully');
    } catch (error) {
      this.logger.error(`Error initializing chat controller: ${error}`);
      throw error;
    }
  }

  async startChat(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log('\nMCP Client Started!');
      console.log('Type your queries or "quit" to exit.');

      while (true) {
        const query = await rl.question('\nQuery: ');
        if (query.toLowerCase() === 'quit') {
          break;
        }

        try {
          const response = await this.manager.processQuery(query);
          console.log('\n' + response);
        } catch (error) {
          console.error(`Error processing query: ${error}`);
          this.logger.error(`Error processing query: ${error}`);
        }
      }
    } finally {
      rl.close();
      await this.cleanup();
    }
  }

  private async cleanup(): Promise<void> {
    await this.manager.cleanup();
    this.logger.close();
  }
} 