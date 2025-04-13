import fs from 'fs';
import path from 'path';

export class Logger {
  private logDir: string;
  private currentDate: string;
  private logStream: fs.WriteStream | null;

  constructor(logDir: string = 'logs') {
    this.logDir = logDir;
    this.currentDate = this.getFormattedDate();
    this.logStream = null;
    this.initLogStream();
  }

  private getFormattedDate(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  }

  private initLogStream(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    const logFile = path.join(this.logDir, `${this.currentDate}.log`);
    this.logStream = fs.createWriteStream(logFile, { flags: 'a' });
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}\n`;
  }

  public info(message: string): void {
    const formattedMessage = this.formatMessage('INFO', message);
    console.log(formattedMessage.trim());
    this.logStream?.write(formattedMessage);
  }

  public error(message: string): void {
    const formattedMessage = this.formatMessage('ERROR', message);
    console.error(formattedMessage.trim());
    this.logStream?.write(formattedMessage);
  }

  public close(): void {
    this.logStream?.end();
  }
} 