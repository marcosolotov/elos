import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { DatabaseService } from './database/DatabaseService';
import { EstoqueService } from './services/EstoqueService';
import { LoteService } from './services/LoteService';
import { RelatorioService } from './services/RelatorioService';

// @ts-ignore
let mainWindow: any = null;
let databaseService: DatabaseService;
let estoqueService: EstoqueService;
let loteService: LoteService;
let relatorioService: RelatorioService;

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
    titleBarStyle: 'hidden-inset',
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
  // Initialize database
  databaseService = new DatabaseService();
  await databaseService.initialize();
  
  // Initialize services
  estoqueService = new EstoqueService(databaseService);
  loteService = new LoteService(databaseService);
  relatorioService = new RelatorioService(databaseService);

  // Setup IPC handlers
  setupIpcHandlers();

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
  ipcMain.handle('lote:historico', async (_: any, id: string): Promise<any[]> => {
    return loteService.obterHistorico(id);
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
  ipcMain.handle('validade:alertas', async (): Promise<any[]> => {
    return loteService.obterAlertasValidade();
  });

  // Inventario handlers
  // @ts-ignore
  ipcMain.handle('inventario:abrir', async (_: any, inventario: any): Promise<any> => {
    return estoqueService.abrirInventario(inventario);
  });

  // @ts-ignore
  ipcMain.handle('inventario:finalizar', async (_: any, id: string): Promise<void> => {
    return estoqueService.finalizarInventario(id);
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