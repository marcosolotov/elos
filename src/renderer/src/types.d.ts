declare module '*.css' {
  const content: string;
  export default content;
}

declare global {
  interface Window {
    electronAPI: {
      listarItens: () => Promise<any[]>;
      cadastrarItem: (item: any) => Promise<any>;
      atualizarItem: (id: string, item: any) => Promise<void>;
      excluirItem: (id: string) => Promise<void>;
      listarLotes: () => Promise<any[]>;
      listarLotesArquivados: () => Promise<any[]>;
      listarLotesPorPeriodo: (inicio: string, fim: string) => Promise<any[]>;
      cadastrarLote: (lote: any) => Promise<any>;
      consultarLote: (id: string) => Promise<any>;
      atualizarLote: (id: string, dados: any) => Promise<void>;
      excluirLote: (id: string) => Promise<void>;
      obterHistoricoLote: (id: string) => Promise<any[]>;
      registrarEntrada: (mov: any) => Promise<any>;
      registrarSaida: (mov: any) => Promise<any>;
      listarMovimentacoesPorLote: (loteId: string) => Promise<any[]>;
      obterAlertasValidade: (dias?: number) => Promise<any[]>;
      abrirInventario: (inv: any) => Promise<any>;
      finalizarInventario: (id: string) => Promise<{ ajustes: any[] }>;
      listarInventarios: () => Promise<any[]>;
      listarItensInventario: (inventarioId: string) => Promise<any[]>;
      salvarContagem: (contagem: any) => Promise<void>;
      obterListaCompraAberta: () => Promise<any>;
      criarListaCompra: () => Promise<any>;
      listarItensListaCompra: (listaId: string) => Promise<any[]>;
      adicionarItemListaCompra: (dados: any) => Promise<void>;
      finalizarListaCompra: (listaId: string) => Promise<void>;
      listarSugestoesCompra: () => Promise<any[]>;
      listarPerdas: () => Promise<any[]>;
      registrarPerda: (loteId: string, quantidade: number, motivo: string) => Promise<void>;
      listarSaidas: () => Promise<any[]>;
      gerarRelatorioPosicaoEstoque: () => Promise<any[]>;
      gerarRelatorioIndicadores: (inicio: string, fim: string) => Promise<any>;
      gerarQRCode: (dados: any) => Promise<string>;
      consultarPorQRCode: (codigo: string) => Promise<any>;
      imprimirEtiqueta: (dados: any) => Promise<void>;
      backup: (caminho: string) => Promise<void>;
      restaurar: (caminho: string) => Promise<void>;
    };
  }
}
