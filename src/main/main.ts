import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseService } from './database/DatabaseService';
import { EstoqueService } from './services/EstoqueService';
import { LoteService } from './services/LoteService';
import { RelatorioService } from './services/RelatorioService';
import { PrintService } from './services/PrintService';
import { LogService } from './services/LogService';
import { GoogleDriveService } from './services/GoogleDriveService';

// @ts-ignore
let mainWindow: any = null;
let databaseService: DatabaseService;
let estoqueService: EstoqueService;
let loteService: LoteService;
let relatorioService: RelatorioService;
let printService: PrintService;
let logService: LogService;
let googleDriveService: GoogleDriveService;

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 900,
    width: 1400,
    minHeight: 700,
    minWidth: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    } as any,
    icon: path.join(__dirname, '../renderer/assets/icon.png'),
    show: false,
    titleBarStyle: 'hiddenInset',
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// @ts-ignore
(app as any).whenReady().then(async () => {
  // Initialize LogService FIRST to capture all logs from the start
  logService = new LogService();
  googleDriveService = new GoogleDriveService();
  await googleDriveService.initialize();

  // Initialize database
  databaseService = new DatabaseService();
  await databaseService.initialize();

  // Initialize services
  estoqueService = new EstoqueService(databaseService);
  loteService = new LoteService(databaseService);
  relatorioService = new RelatorioService(databaseService);
  printService = new PrintService();

  // Setup IPC handlers
  setupIpcHandlers();

  // Arquivar lotes com saldo zero
  loteService.arquivarLotesComSaldoZero();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpcHandlers() {
  // Item handlers
  // @ts-ignore
  ipcMain.handle('item:listar', async (): Promise<any[]> => {
    return estoqueService.listarItens();
  });

  // @ts-ignore
  ipcMain.handle('item:cadastrar', async (_: any, item: any): Promise<any> => {
    return estoqueService.cadastrarItem(item);
  });

  // @ts-ignore
  ipcMain.handle('item:atualizar', async (_: any, id: string, item: any): Promise<void> => {
    return estoqueService.atualizarItem(id, item);
  });

  // @ts-ignore
  ipcMain.handle('item:excluir', async (_: any, id: string): Promise<void> => {
    return estoqueService.excluirItem(id);
  });

  // Lote handlers
  // @ts-ignore
  ipcMain.handle('lote:listar', async (): Promise<any[]> => {
    return loteService.listarLotes();
  });

  // @ts-ignore
  ipcMain.handle('lote:cadastrar', async (_: any, lote: any): Promise<any> => {
    return loteService.cadastrarLote(lote);
  });

  // @ts-ignore
  ipcMain.handle('lote:consultar', async (_: any, id: string): Promise<any> => {
    return loteService.consultarLote(id);
  });

  // @ts-ignore
  ipcMain.handle('lote:atualizar', async (_: any, id: string, dados: any): Promise<void> => {
    return loteService.atualizarLote(id, dados);
  });

  // @ts-ignore
  ipcMain.handle('lote:excluir', async (_: any, id: string): Promise<void> => {
    return loteService.inativarLote(id);
  });

  // @ts-ignore
  ipcMain.handle('lote:historico', async (_: any, id: string): Promise<any[]> => {
    return loteService.obterHistorico(id);
  });

  // @ts-ignore
  ipcMain.handle('lote:listarArquivados', async (): Promise<any[]> => {
    return loteService.listarLotesArquivados();
  });

  // @ts-ignore
  ipcMain.handle('lote:listarPorPeriodo', async (_: any, inicio: string, fim: string): Promise<any[]> => {
    return loteService.listarLotesPorPeriodo(inicio, fim);
  });

  // Movimentacao handlers
  // @ts-ignore
  ipcMain.handle('movimentacao:registrarEntrada', async (_: any, movimentacao: any): Promise<any> => {
    return estoqueService.registrarEntrada(movimentacao);
  });

  // @ts-ignore
  ipcMain.handle('movimentacao:registrarSaida', async (_: any, movimentacao: any): Promise<any> => {
    return estoqueService.registrarSaida(movimentacao);
  });

  // @ts-ignore
  ipcMain.handle('movimentacao:listarPorLote', async (_: any, loteId: string): Promise<any[]> => {
    return estoqueService.listarMovimentacoesPorLote(loteId);
  });

  // Validade handlers
  // @ts-ignore
  ipcMain.handle('validade:alertas', async (_: any, dias?: number): Promise<any[]> => {
    return loteService.obterAlertasValidade(dias);
  });

  // Inventario handlers
  // @ts-ignore
  ipcMain.handle('inventario:abrir', async (_: any, inventario: any): Promise<any> => {
    return estoqueService.abrirInventario(inventario);
  });

  // @ts-ignore
  ipcMain.handle('inventario:finalizar', async (_: any, id: string): Promise<{ ajustes: any[] }> => {
    return estoqueService.finalizarInventario(id);
  });

  // @ts-ignore
  ipcMain.handle('inventario:listar', async (): Promise<any[]> => {
    return estoqueService.listarInventarios();
  });

  // @ts-ignore
  ipcMain.handle('inventario:listarItens', async (_: any, inventarioId: string): Promise<any[]> => {
    return estoqueService.listarItensInventario(inventarioId);
  });

  // @ts-ignore
  ipcMain.handle('inventario:salvarContagem', async (_: any, contagem: any): Promise<void> => {
    return estoqueService.salvarContagem(contagem);
  });

  // Compra handlers
  // @ts-ignore
  ipcMain.handle('compra:obterListaAberta', async (): Promise<any> => {
    return estoqueService.obterListaCompraAberta();
  });

  // @ts-ignore
  ipcMain.handle('compra:criarLista', async (): Promise<any> => {
    return estoqueService.criarListaCompra();
  });

  // @ts-ignore
  ipcMain.handle('compra:listarItens', async (_: any, listaId: string): Promise<any[]> => {
    return estoqueService.listarItensListaCompra(listaId);
  });

  // @ts-ignore
  ipcMain.handle('compra:adicionarItem', async (_: any, dados: any): Promise<void> => {
    return estoqueService.adicionarItemListaCompra(dados);
  });

  // @ts-ignore
  ipcMain.handle('compra:finalizar', async (_: any, listaId: string): Promise<void> => {
    return estoqueService.finalizarListaCompra(listaId);
  });

  // @ts-ignore
  ipcMain.handle('compra:listarSugestoes', async (): Promise<any[]> => {
    return estoqueService.listarSugestoesCompra();
  });

  // @ts-ignore
  ipcMain.handle('perda:listar', async (): Promise<any[]> => {
    return estoqueService.listarPerdas();
  });

  // @ts-ignore
  ipcMain.handle('perda:registrar', async (_: any, loteId: string, quantidade: number, motivo: string): Promise<void> => {
    return estoqueService.registrarPerda(loteId, quantidade, motivo);
  });

  // @ts-ignore
  ipcMain.handle('saida:listar', async (): Promise<any[]> => {
    return estoqueService.listarSaidas();
  });

  // Relatorio handlers
  // @ts-ignore
  ipcMain.handle('relatorio:posicaoEstoque', async (): Promise<any[]> => {
    return relatorioService.gerarRelatorioPosicaoEstoque();
  });

  // @ts-ignore
  ipcMain.handle('relatorio:indicadores', async (_: any, periodoInicio: string, periodoFim: string): Promise<any> => {
    return relatorioService.gerarRelatorioIndicadores(periodoInicio, periodoFim);
  });

  // QR Code handlers
  // @ts-ignore
  ipcMain.handle('qrcode:gerar', async (_: any, dados: any): Promise<string> => {
    return loteService.gerarQRCode(dados);
  });

  // @ts-ignore
  ipcMain.handle('qrcode:consultar', async (_: any, codigo: string): Promise<any> => {
    return loteService.consultarPorQRCode(codigo);
  });

  // Print handlers
  // @ts-ignore
  ipcMain.handle('print:imprimirEtiqueta', async (_: any, dados: any): Promise<void> => {
    return printService.imprimirEtiqueta(dados);
  });

  // Log handlers
  // @ts-ignore
  ipcMain.handle('log:getLogs', async (_: any, dataInicio?: string, dataFim?: string): Promise<any[]> => {
    return logService.getLogs(dataInicio, dataFim);
  });

  // @ts-ignore
  ipcMain.handle('log:exportLogs', async (_: any, dataInicio?: string, dataFim?: string): Promise<string> => {
    return logService.exportLogs(dataInicio, dataFim);
  });

  // @ts-ignore
  ipcMain.handle('log:clearLogs', async (_: any, dataInicio?: string, dataFim?: string): Promise<void> => {
    return logService.clearLogs(dataInicio, dataFim);
  });

  // Google Drive handlers
  // @ts-ignore
  ipcMain.handle('drive:status', async (): Promise<{ authenticated: boolean }> => {
    return { authenticated: googleDriveService.isAuthenticated() };
  });

  // @ts-ignore
  ipcMain.handle('drive:authenticate', async (): Promise<boolean> => {
    return googleDriveService.authenticate(mainWindow);
  });

  // @ts-ignore
  ipcMain.handle('drive:disconnect', async (): Promise<void> => {
    return googleDriveService.disconnect();
  });

  // @ts-ignore
  ipcMain.handle('drive:uploadBackup', async (_: any, description?: string): Promise<any> => {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'elos.db');
    return googleDriveService.uploadBackup(dbPath, description);
  });

  // @ts-ignore
  ipcMain.handle('drive:listBackups', async (): Promise<any[]> => {
    return googleDriveService.listBackups();
  });

  // @ts-ignore
  ipcMain.handle('drive:downloadBackup', async (_: any, fileId: string): Promise<void> => {
    const userDataPath = app.getPath('userData');
    const destPath = path.join(userDataPath, 'restored-backup.db');
    await googleDriveService.downloadBackup(fileId, destPath);
    // Restaurar o banco de dados com o arquivo baixado
    await databaseService.restaurar(destPath);
    // Limpar arquivo temporário
    try { fs.unlinkSync(destPath); } catch {}
  });

  // @ts-ignore
  ipcMain.handle('drive:deleteBackup', async (_: any, fileId: string): Promise<void> => {
    return googleDriveService.deleteBackup(fileId);
  });

  // Database handlers
  // @ts-ignore
  ipcMain.handle('db:backup', async (_: any, caminho: string): Promise<void> => {
    return databaseService.backup(caminho);
  });

  // @ts-ignore
  ipcMain.handle('db:restaurar', async (_: any, caminho: string): Promise<void> => {
    return databaseService.restaurar(caminho);
  });
}