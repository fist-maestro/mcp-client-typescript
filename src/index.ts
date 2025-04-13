import { ChatController } from './controllers/ChatController.js';
import { parseArgs } from 'node:util';

async function main() {
  try {
    // 解析命令行参数
    const { values } = parseArgs({
      options: {
        provider: {
          type: 'string',
          short: 'p',
          default: 'deepseek'
        }
      }
    });

    const provider = values.provider?.toLowerCase();
    if (provider !== 'deepseek' && provider !== 'anthropic') {
      throw new Error('不支持的LLM服务商。请使用 --provider=deepseek 或 --provider=anthropic');
    }

    const controller = new ChatController(provider);
    await controller.initialize();
    await controller.startChat();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 