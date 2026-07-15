import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  stack?: string;
}

export class LogService {
  private logDir: string;
  private currentLogFile: string;
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private originalConsole: { log: any; warn: any; error: any; info: any; debug: any } | null = null;
  private initialized = false;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.logDir = path.join(userDataPath, 'logs');

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    const today = new Date().toISOString().split('T')[0];
    this.currentLogFile = path.join(this.logDir, `logs-${today}.txt`);

    // Escreve header no arquivo de log
    const header = `=== LOG INICIADO: ${new Date().toLocaleString('pt-BR')} ===\n`;
    fs.appendFileSync(this.currentLogFile, header, 'utf-8');

    // Sobrescrever console para capturar logs imediatamente
    this.captureConsole();

    // Iniciar flush automático a cada 3 segundos
    this.flushInterval = setInterval(() => this.flush(), 3000);

    // Capturar erros não capturados
    this.captureGlobalErrors();

    this.initialized = true;
    this.writeLog('info', 'LogService', 'Sistema de logs inicializado');
  }

  private captureConsole(): void {
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };

    const self = this;
    console.log = function (...args: any[]) {
      self.originalConsole!.log(...args);
      self.writeLog('info', 'console', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    console.warn = function (...args: any[]) {
      self.originalConsole!.warn(...args);
      self.writeLog('warn', 'console', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    console.error = function (...args: any[]) {
      self.originalConsole!.error(...args);
      self.writeLog('error', 'console', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    console.info = function (...args: any[]) {
      self.originalConsole!.info(...args);
      self.writeLog('info', 'console', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    console.debug = function (...args: any[]) {
      self.originalConsole!.debug(...args);
      self.writeLog('debug', 'console', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };
  }

  private captureGlobalErrors(): void {
    process.on('uncaughtException', (error: Error) => {
      this.writeLog('error', 'uncaughtException', error.message, error.stack);
    });

    process.on('unhandledRejection', (reason: any) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      this.writeLog('error', 'unhandledRejection', message, stack);
    });
  }

  writeLog(level: LogEntry['level'], source: string, message: string, stack?: string): void {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      stack,
    };

    this.buffer.push(entry);
    this.flush(); // flush imediato para garantir que nada se perca
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    const entries = this.buffer.splice(0);

    try {
      const lines = entries.map(entry => {
        const timestamp = new Date(entry.timestamp).toLocaleString('pt-BR');
        const stack = entry.stack ? `\nStack: ${entry.stack}` : '';
        return `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}${stack}`;
      });

      const content = lines.join('\n') + '\n';
      fs.appendFileSync(this.currentLogFile, content, 'utf-8');
    } catch (err) {
      if (this.originalConsole?.error) {
        this.originalConsole.error('Erro ao escrever log:', err);
      }
    }
  }

  async getLogs(dataInicio?: string, dataFim?: string): Promise<LogEntry[]> {
    const logs: LogEntry[] = [];
    const startDate = dataInicio ? new Date(dataInicio) : new Date(0);
    const endDate = dataFim ? new Date(dataFim) : new Date('9999-12-31T23:59:59');

    // Forçar flush antes de ler
    if (this.initialized) {
      this.flush();
    }

    try {
      if (!fs.existsSync(this.logDir)) return [];

      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('logs-') && f.endsWith('.txt'))
        .sort();

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Pular linhas de cabeçalho/rodapé
          if (line.startsWith('===') || line.startsWith('Fim do relatório')) continue;

          // Parse: [timestamp] [LEVEL] [source] message
          // timestamp pode conter vírgula: "15/07/2026, 17:02:49"
          const match = line.match(/^\[(.+?)\] \[([A-Z]+)\] \[(.+?)\] (.+)$/);
          if (match) {
            const timestampStr = match[1]; // "15/07/2026, 17:02:49"
            const level = match[2].toLowerCase() as LogEntry['level'];
            const source = match[3];
            const message = match[4];

            // Converter timestamp pt-BR para Date
            try {
              // "15/07/2026, 17:02:49" -> partes
              const commaIdx = timestampStr.indexOf(', ');
              if (commaIdx === -1) continue;

              const datePart = timestampStr.substring(0, commaIdx);
              const timePart = timestampStr.substring(commaIdx + 2);

              const [day, month, year] = datePart.split('/');
              const logDate = new Date(`${year}-${month}-${day}T${timePart}`);

              if (logDate >= startDate && logDate <= endDate) {
                logs.push({
                  id: `${file}-${i}`,
                  timestamp: logDate.toISOString(),
                  level,
                  source,
                  message,
                });
              }
            } catch {
              // Se falhar ao converter data, ignorar esta linha
            }
          }
        }
      }
    } catch (err) {
      if (this.originalConsole?.error) {
        this.originalConsole.error('Erro ao ler logs:', err);
      }
    }

    // Ordenar por timestamp
    logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return logs;
  }

  async exportLogs(dataInicio?: string, dataFim?: string): Promise<string> {
    const logs = await this.getLogs(dataInicio, dataFim);

    const header = '=== LOGS ELOS ===\n';
    const period = `Período: ${dataInicio || 'Início'} até ${dataFim || 'Agora'}\n`;
    const total = `Total de registros: ${logs.length}\n`;
    const separator = '='.repeat(60) + '\n\n';

    let content = header + period + total + separator;

    for (const entry of logs) {
      const timestamp = new Date(entry.timestamp).toLocaleString('pt-BR');
      content += `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}\n`;
    }

    if (logs.length === 0) {
      content += 'Nenhum registro encontrado para o período selecionado.\n';
    }

    content += `\n${separator}`;
    content += `Fim do relatório - ${new Date().toLocaleString('pt-BR')}\n`;

    return content;
  }

  async clearLogs(dataInicio?: string, dataFim?: string): Promise<void> {
    if (!dataInicio && !dataFim) {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('logs-') && f.endsWith('.txt'));
      for (const file of files) {
        fs.unlinkSync(path.join(this.logDir, file));
      }
      // Recriar arquivo atual com header
      const header = `=== LOG INICIADO: ${new Date().toLocaleString('pt-BR')} ===\n`;
      fs.writeFileSync(this.currentLogFile, header, 'utf-8');
    }
  }

  getLogDirectory(): string {
    return this.logDir;
  }

  destroy(): void {
    this.flush();
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    if (this.originalConsole) {
      console.log = this.originalConsole.log;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
      console.info = this.originalConsole.info;
      console.debug = this.originalConsole.debug;
    }
  }
}