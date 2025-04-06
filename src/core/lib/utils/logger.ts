export class Logger {
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.name}] ${message} ${args.length ? JSON.stringify(args) : ''}`;
  }

  public info(message: string, ...args: any[]): void {
    console.info(this.formatMessage('INFO', message, ...args));
  }

  public warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('WARN', message, ...args));
  }

  public error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('ERROR', message, ...args));
  }

  public debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, ...args));
    }
  }
} 