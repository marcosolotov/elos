import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { DatabaseService } from '../database/DatabaseService';
import { Lote, EtiquetaQRCode, AlertaValidade } from '../../shared/types';

export class LoteService {
  constructor(private db: DatabaseService) {}

  listarLotes(): Lote[] {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    return repo.listarTodos();
  }

  cadastrarLote(lote: Omit<Lote, 'id' | 'created_at'>): Lote {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    const novoLote: Lote = {
      ...lote,
      id: uuidv4(),
      created_at: new Date(),
    };
    repo.criar(novoLote);
    return novoLote;
  }

  consultarLote(id: string): Lote | null {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    return repo.buscarPorId(id);
  }

  atualizarLote(id: string, dados: Partial<Lote>): void {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    repo.atualizar(id, dados);
  }

  inativarLote(id: string): void {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    repo.inativar(id);
  }

  obterHistorico(loteId: string): any[] {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    return repo.obterHistorico(loteId);
  }

  async gerarQRCode(dados: { loteId: string; codigoLote: string; itemNome: string }): Promise<string> {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    
    // Verificar se já existe uma etiqueta para este lote
    let etiquetaExistente = repo.buscarEtiquetaPorLote(dados.loteId);
    
    let codigoUnico: string;
    
    if (etiquetaExistente) {
      // Usar código existente
      codigoUnico = etiquetaExistente.codigo_unico;
    } else {
      // Criar nova etiqueta
      codigoUnico = `LOTE-${dados.codigoLote}`;
      
      const etiqueta: Omit<EtiquetaQRCode, 'created_at'> = {
        id: uuidv4(),
        lote_id: dados.loteId,
        codigo_unico: codigoUnico,
        data_geracao: new Date(),
        impresso: false,
      };
      repo.criarEtiquetaQRCode(etiqueta);
    }

    // Gerar QR Code como imagem base64
    const qrData = JSON.stringify({
      codigo: codigoUnico,
      lote: dados.codigoLote,
      item: dados.itemNome,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1a3a5c',
        light: '#ffffff',
      },
    });

    return qrCodeDataUrl;
  }

  consultarPorQRCode(codigo: string): any {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    return repo.consultarPorQRCode(codigo);
  }

  obterAlertasValidade(diasAlerta: number = 30): AlertaValidade[] {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    const resultados = repo.obterAlertasValidade(diasAlerta);

    return resultados.map((r: any) => {
      let urgencia: 'critica' | 'alta' | 'media' | 'baixa' = 'baixa';
      if (r.dias_para_vencer <= 0) urgencia = 'critica';
      else if (r.dias_para_vencer <= 7) urgencia = 'critica';
      else if (r.dias_para_vencer <= 15) urgencia = 'alta';
      else if (r.dias_para_vencer <= 30) urgencia = 'media';

      return {
        lote_id: r.lote_id,
        item_nome: r.item_nome,
        codigo_lote: r.codigo_lote,
        data_validade: r.data_validade,
        dias_para_vencer: r.dias_para_vencer,
        saldo_atual: r.saldo_atual,
        urgencia,
      };
    });
  }

  registrarPerda(perda: { lote_id: string; quantidade: number; motivo: string; usuario_id: string }): void {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    
    // Buscar lote
    const lote = repo.buscarPorId(perda.lote_id);
    if (!lote) {
      throw new Error('Lote não encontrado');
    }

    // Validar saldo suficiente
    if (lote.saldo_atual < perda.quantidade) {
      throw new Error(`Saldo insuficiente para perda. Disponível: ${lote.saldo_atual}, Solicitado: ${perda.quantidade}`);
    }

    // Registrar perda
    repo.registrarPerda({
      id: uuidv4(),
      lote_id: perda.lote_id,
      quantidade: perda.quantidade,
      motivo: perda.motivo,
      data: new Date().toISOString(),
      usuario_id: perda.usuario_id,
      created_at: new Date().toISOString(),
    });

    // Atualizar saldo
    const novoSaldo = lote.saldo_atual - perda.quantidade;
    repo.atualizarSaldo(lote.id, novoSaldo);

    // Arquivar lote se saldo zerar
    if (novoSaldo === 0) {
      repo.atualizar(lote.id, { arquivado: true });
    }
  }

  registrarSaida(saida: { lote_id: string; quantidade: number; usuario_id: string; motivo?: string; documento_referencia?: string }): void {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    
    // Buscar lote
    const lote = repo.buscarPorId(saida.lote_id);
    if (!lote) {
      throw new Error('Lote não encontrado');
    }

    // Validar saldo suficiente
    if (lote.saldo_atual < saida.quantidade) {
      throw new Error(`Saldo insuficiente para saída. Disponível: ${lote.saldo_atual}, Solicitado: ${saida.quantidade}`);
    }

    // Registrar movimentação de saída
    repo.registrarMovimentacao({
      id: uuidv4(),
      lote_id: saida.lote_id,
      tipo: 'saida',
      quantidade: saida.quantidade,
      data: new Date().toISOString(),
      usuario_id: saida.usuario_id,
      motivo: saida.motivo || null,
      documento_referencia: saida.documento_referencia || null,
      created_at: new Date().toISOString(),
    });

    // Atualizar saldo
    const novoSaldo = lote.saldo_atual - saida.quantidade;
    repo.atualizarSaldo(lote.id, novoSaldo);

    // Arquivar lote se saldo zerar
    if (novoSaldo === 0) {
      repo.atualizar(lote.id, { arquivado: true });
    }
  }

  listarLotesArquivados(): Lote[] {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    return repo.listarArquivados();
  }

  listarLotesPorPeriodo(dataInicio: string, dataFim: string): Lote[] {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    return repo.listarPorPeriodo(dataInicio, dataFim);
  }

  obterPerdasPorPeriodo(dataInicio: string, dataFim: string): any[] {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    return repo.obterPerdasPorPeriodo(dataInicio, dataFim);
  }

  arquivarLotesComSaldoZero(): void {
    const repo = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    const lotes = repo.listarTodos(false); // Buscar todos, incluindo arquivados
    
    let arquivados = 0;
    lotes.forEach((lote: Lote) => {
      if (lote.saldo_atual === 0 && !lote.arquivado) {
        repo.atualizar(lote.id, { arquivado: true });
        arquivados++;
      }
    });
    
    if (arquivados > 0) {
      console.log(`[LoteService] ${arquivados} lotes com saldo zero foram arquivados`);
    }
  }
}
