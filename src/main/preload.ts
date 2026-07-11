// @ts-ignore
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
// @ts-ignore
contextBridge.exposeInMainWorld('electronAPI', {
  // Item operations
  // @ts-ignore
  listarItens: () => (ipcRenderer as any).invoke('item:listar'),
  // @ts-ignore
  cadastrarItem: (item: any) => (ipcRenderer as any).invoke('item:cadastrar', item),
  // @ts-ignore
  atualizarItem: (id: string, item: any) => (ipcRenderer as any).invoke('item:atualizar', id, item),
  // @ts-ignore
  excluirItem: (id: string) => (ipcRenderer as any).invoke('item:excluir', id),

  // Lote operations
  // @ts-ignore
  listarLotes: () => (ipcRenderer as any).invoke('lote:listar'),
  // @ts-ignore
  cadastrarLote: (lote: any) => (ipcRenderer as any).invoke('lote:cadastrar', lote),
  // @ts-ignore
  consultarLote: (id: string) => (ipcRenderer as any).invoke('lote:consultar', id),
  // @ts-ignore
  obterHistoricoLote: (id: string) => (ipcRenderer as any).invoke('lote:historico', id),

  // Movimentação operations
  // @ts-ignore
  registrarEntrada: (mov: any) => (ipcRenderer as any).invoke('movimentacao:registrarEntrada', mov),
  // @ts-ignore
  registrarSaida: (mov: any) => (ipcRenderer as any).invoke('movimentacao:registrarSaida', mov),
  // @ts-ignore
  listarMovimentacoesPorLote: (loteId: string) => (ipcRenderer as any).invoke('movimentacao:listarPorLote', loteId),

  // Validade operations
  // @ts-ignore
  obterAlertasValidade: () => (ipcRenderer as any).invoke('validade:alertas'),

  // Inventário operations
  // @ts-ignore
  abrirInventario: (inv: any) => (ipcRenderer as any).invoke('inventario:abrir', inv),
  // @ts-ignore
  finalizarInventario: (id: string) => (ipcRenderer as any).invoke('inventario:finalizar', id),

  // Relatório operations
  // @ts-ignore
  gerarRelatorioPosicaoEstoque: () => (ipcRenderer as any).invoke('relatorio:posicaoEstoque'),
  // @ts-ignore
  gerarRelatorioIndicadores: (inicio: string, fim: string) => (ipcRenderer as any).invoke('relatorio:indicadores', inicio, fim),

  // QR Code operations
  // @ts-ignore
  gerarQRCode: (dados: any) => (ipcRenderer as any).invoke('qrcode:gerar', dados),
  // @ts-ignore
  consultarPorQRCode: (codigo: string) => (ipcRenderer as any).invoke('qrcode:consultar', codigo),

  // Database operations
  // @ts-ignore
  backup: (caminho: string) => (ipcRenderer as any).invoke('db:backup', caminho),
  // @ts-ignore
  restaurar: (caminho: string) => (ipcRenderer as any).invoke('db:restaurar', caminho),
});

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      listarItens: () => Promise<any[]>;
      cadastrarItem: (item: any) => Promise<any>;
      atualizarItem: (id: string, item: any) => Promise<void>;
      excluirItem: (id: string) => Promise<void>;
      listarLotes: () => Promise<any[]>;
      cadastrarLote: (lote: any) => Promise<any>;
      consultarLote: (id: string) => Promise<any>;
      obterHistoricoLote: (id: string) => Promise<any[]>;
      registrarEntrada: (mov: any) => Promise<any>;
      registrarSaida: (mov: any) => Promise<any>;
      listarMovimentacoesPorLote: (loteId: string) => Promise<any[]>;
      obterAlertasValidade: () => Promise<any[]>;
      abrirInventario: (inv: any) => Promise<any>;
      finalizarInventario: (id: string) => Promise<void>;
      gerarRelatorioPosicaoEstoque: () => Promise<any[]>;
      gerarRelatorioIndicadores: (inicio: string, fim: string) => Promise<any>;
      gerarQRCode: (dados: any) => Promise<string>;
      consultarPorQRCode: (codigo: string) => Promise<any>;
      backup: (caminho: string) => Promise<void>;
      restaurar: (caminho: string) => Promise<void>;
    };
  }
}