import Database from 'better-sqlite3';
import { Lote, Movimentacao, PerdaDesperdicio, EtiquetaQRCode } from '../../../shared/types';

export class LoteRepository {
  constructor(private db: Database.Database) {}

  listarTodos(): Lote[] {
    const stmt = this.db.prepare(`
      SELECT l.*, i.nome as item_nome
      FROM lote l
      JOIN item i ON l.item_id = i.id
      WHERE l.ativo = 1
      ORDER BY l.data_validade ASC
    `);
    return stmt.all() as Lote[];
  }

  buscarPorId(id: string): Lote | null {
    const stmt = this.db.prepare('SELECT * FROM lote WHERE id = ?');
    return (stmt.get(id) as Lote) || null;
  }

  buscarPorItem(itemId: string): Lote[] {
    const stmt = this.db.prepare(`
      SELECT * FROM lote 
      WHERE item_id = ? AND ativo = 1 
      ORDER BY data_validade ASC
    `);
    return stmt.all(itemId) as Lote[];
  }

  buscarPorCodigoLote(codigoLote: string): Lote | null {
    const stmt = this.db.prepare('SELECT * FROM lote WHERE codigo_lote = ? AND ativo = 1');
    return (stmt.get(codigoLote) as Lote) || null;
  }

  criar(lote: Omit<Lote, 'created_at'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO lote (id, item_id, codigo_lote, data_fabricacao, data_validade, 
                       quantidade_inicial, saldo_atual, fornecedor_id, data_entrada, ativo, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      lote.id, lote.item_id, lote.codigo_lote, lote.data_fabricacao || null,
      lote.data_validade, lote.quantidade_inicial, lote.saldo_atual,
      lote.fornecedor_id || null, lote.data_entrada, lote.ativo ? 1 : 0,
      new Date().toISOString()
    );
  }

  atualizarSaldo(id: string, novoSaldo: number): void {
    const stmt = this.db.prepare('UPDATE lote SET saldo_atual = ? WHERE id = ?');
    stmt.run(novoSaldo, id);
  }

  inativar(id: string): void {
    const stmt = this.db.prepare('UPDATE lote SET ativo = 0 WHERE id = ?');
    stmt.run(id);
  }

  // Movimentações
  registrarMovimentacao(mov: Omit<Movimentacao, 'created_at'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO movimentacao (id, lote_id, tipo, quantidade, data, usuario_id, motivo, documento_referencia, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(mov.id, mov.lote_id, mov.tipo, mov.quantidade, mov.data, 
             mov.usuario_id, mov.motivo || null, mov.documento_referencia || null,
             new Date().toISOString());
  }

  obterHistorico(loteId: string): Movimentacao[] {
    const stmt = this.db.prepare(`
      SELECT m.*, u.nome as usuario_nome
      FROM movimentacao m
      LEFT JOIN usuario u ON m.usuario_id = u.id
      WHERE m.lote_id = ?
      ORDER BY m.data DESC
    `);
    return stmt.all(loteId) as Movimentacao[];
  }

  listarMovimentacoesPorPeriodo(dataInicio: string, dataFim: string): Movimentacao[] {
    const stmt = this.db.prepare(`
      SELECT m.*, l.codigo_lote, i.nome as item_nome
      FROM movimentacao m
      JOIN lote l ON m.lote_id = l.id
      JOIN item i ON l.item_id = i.id
      WHERE m.data BETWEEN ? AND ?
      ORDER BY m.data DESC
    `);
    return stmt.all(dataInicio, dataFim) as Movimentacao[];
  }

  // Perdas
  registrarPerda(perda: Omit<PerdaDesperdicio, 'created_at'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO perda_desperdicio (id, lote_id, quantidade, motivo, data, usuario_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(perda.id, perda.lote_id, perda.quantidade, perda.motivo, 
             perda.data, perda.usuario_id, new Date().toISOString());
  }

  obterPerdasPorPeriodo(dataInicio: string, dataFim: string): PerdaDesperdicio[] {
    const stmt = this.db.prepare(`
      SELECT p.*, l.codigo_lote, i.nome as item_nome
      FROM perda_desperdicio p
      JOIN lote l ON p.lote_id = l.id
      JOIN item i ON l.item_id = i.id
      WHERE p.data BETWEEN ? AND ?
      ORDER BY p.data DESC
    `);
    return stmt.all(dataInicio, dataFim) as PerdaDesperdicio[];
  }

  // QR Code
  criarEtiquetaQRCode(etiqueta: Omit<EtiquetaQRCode, 'created_at'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO etiqueta_qrcode (id, lote_id, codigo_unico, data_geracao, impresso)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(etiqueta.id, etiqueta.lote_id, etiqueta.codigo_unico, 
             etiqueta.data_geracao, etiqueta.impresso ? 1 : 0);
  }

  consultarPorQRCode(codigoUnico: string): EtiquetaQRCode | null {
    const stmt = this.db.prepare(`
      SELECT e.*, l.item_id, l.codigo_lote, l.saldo_atual, l.data_validade, i.nome as item_nome
      FROM etiqueta_qrcode e
      JOIN lote l ON e.lote_id = l.id
      JOIN item i ON l.item_id = i.id
      WHERE e.codigo_unico = ?
    `);
    return (stmt.get(codigoUnico) as EtiquetaQRCode) || null;
  }

  marcarEtiquetaComoImpressa(id: string): void {
    const stmt = this.db.prepare('UPDATE etiqueta_qrcode SET impresso = 1 WHERE id = ?');
    stmt.run(id);
  }

  // Alertas de validade
  obterAlertasValidade(diasAlerta: number = 30): any[] {
    const stmt = this.db.prepare(`
      SELECT l.id as lote_id, l.codigo_lote, l.data_validade, l.saldo_atual,
             i.nome as item_nome,
             CAST((julianday(l.data_validade) - julianday('now')) AS INTEGER) as dias_para_vencer
      FROM lote l
      JOIN item i ON l.item_id = i.id
      WHERE l.ativo = 1 
        AND l.saldo_atual > 0
        AND l.data_validade <= date('now', '+' || ? || ' days')
      ORDER BY l.data_validade ASC
    `);
    return stmt.all(diasAlerta) as any[];
  }
}