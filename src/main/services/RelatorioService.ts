import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseService } from '../database/DatabaseService';

export class RelatorioService {
  constructor(private db: DatabaseService) {}

  gerarRelatorioPosicaoEstoque(): any[] {
    const db = this.db.getDatabase();
    const stmt = db.prepare(`
      SELECT 
        i.id,
        i.nome,
        i.unidade_medida,
        gc.nome as categoria,
        SUM(l.saldo_atual) as saldo_total,
        COUNT(DISTINCT l.id) as total_lotes,
        MIN(l.data_validade) as proxima_validade
      FROM item i
      LEFT JOIN grupo_categoria gc ON i.categoria_id = gc.id
      LEFT JOIN lote l ON i.id = l.item_id AND l.ativo = 1
      GROUP BY i.id, i.nome, i.unidade_medida, gc.nome
      ORDER BY i.nome
    `);
    return stmt.all() as any[];
  }

  gerarRelatorioIndicadores(dataInicio: string, dataFim: string): any {
    const db = this.db.getDatabase();

    // Perdas por período
    const stmtPerdas = db.prepare(`
      SELECT 
        i.nome as item_nome,
        SUM(p.quantidade) as total_perda,
        COUNT(*) as quantidade_ocorrencias
      FROM perda_desperdicio p
      JOIN lote l ON p.lote_id = l.id
      JOIN item i ON l.item_id = i.id
      WHERE p.data BETWEEN ? AND ?
      GROUP BY i.id, i.nome
      ORDER BY total_perda DESC
    `);
    const perdas = stmtPerdas.all(dataInicio, dataFim) as any[];

    // Rendimento médio
    const stmtRendimento = db.prepare(`
      SELECT 
        i.nome as item_nome,
        AVG(r.percentual) as rendimento_medio,
        COUNT(*) as total_processamentos
      FROM rendimento r
      JOIN item i ON r.item_id = i.id
      WHERE r.data BETWEEN ? AND ?
      GROUP BY i.id, i.nome
    `);
    const rendimentos = stmtRendimento.all(dataInicio, dataFim) as any[];

    // Itens vencidos
    const stmtVencidos = db.prepare(`
      SELECT 
        i.nome as item_nome,
        l.codigo_lote,
        l.data_validade,
        l.saldo_atual
      FROM lote l
      JOIN item i ON l.item_id = i.id
      WHERE l.ativo = 1 
        AND l.saldo_atual > 0
        AND l.data_validade < date('now')
      ORDER BY l.data_validade ASC
    `);
    const vencidos = stmtVencidos.all() as any[];

    // Movimentações totais
    const stmtMov = db.prepare(`
      SELECT 
        tipo,
        COUNT(*) as quantidade,
        SUM(quantidade) as volume_total
      FROM movimentacao
      WHERE data BETWEEN ? AND ?
      GROUP BY tipo
    `);
    const movimentacoes = stmtMov.all(dataInicio, dataFim) as any[];

    return {
      perdas,
      rendimentos,
      vencidos,
      movimentacoes,
      periodo: { inicio: dataInicio, fim: dataFim },
    };
  }

  async exportarRelatorioPDF(caminho: string, dados: any[]): Promise<void> {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(caminho);
    doc.pipe(stream);

    // Título
    doc.fontSize(20).text('Relatório de Posição de Estoque', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown(2);

    // Cabeçalho da tabela
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Item', 50, 150);
    doc.text('Categoria', 200, 150);
    doc.text('Unidade', 300, 150);
    doc.text('Saldo Total', 380, 150);
    doc.text('Lotes', 450, 150);

    // Linhas
    doc.font('Helvetica').fontSize(10);
    let y = 170;
    dados.forEach((item, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(item.nome || '', 50, y, { width: 140 });
      doc.text(item.categoria || '-', 200, y, { width: 90 });
      doc.text(item.unidade_medida || '', 300, y, { width: 70 });
      doc.text(String(item.saldo_total || 0), 380, y, { width: 60 });
      doc.text(String(item.total_lotes || 0), 450, y, { width: 50 });
      y += 20;
    });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  async exportarRelatorioIndicadoresPDF(caminho: string, indicadores: any): Promise<void> {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(caminho);
    doc.pipe(stream);

    // Título
    doc.fontSize(20).text('Relatório de Indicadores', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Período: ${indicadores.periodo.inicio} a ${indicadores.periodo.fim}`, { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown(2);

    let y = 150;

    // Perdas
    doc.fontSize(14).font('Helvetica-Bold').text('Perdas e Desperdícios', 50, y);
    y += 25;
    doc.fontSize(10).font('Helvetica');
    
    indicadores.perdas.forEach((perda: any) => {
      doc.text(`${perda.item_nome}: ${perda.total_perda} (${perda.quantidade_ocorrencias} ocorrências)`, 50, y);
      y += 15;
    });

    y += 20;

    // Rendimento
    doc.fontSize(14).font('Helvetica-Bold').text('Rendimento Médio', 50, y);
    y += 25;
    doc.fontSize(10).font('Helvetica');
    
    indicadores.rendimentos.forEach((rend: any) => {
      doc.text(`${rend.item_nome}: ${rend.rendimento_medio.toFixed(2)}% (${rend.total_processamentos} processamentos)`, 50, y);
      y += 15;
    });

    y += 20;

    // Itens Vencidos
    doc.fontSize(14).font('Helvetica-Bold').text('Itens Vencidos', 50, y);
    y += 25;
    doc.fontSize(10).font('Helvetica');
    
    if (indicadores.vencidos.length === 0) {
      doc.text('Nenhum item vencido encontrado.', 50, y);
    } else {
      indicadores.vencidos.forEach((item: any) => {
        doc.text(`${item.item_nome} - Lote: ${item.codigo_lote} - Vencimento: ${item.data_validade} - Saldo: ${item.saldo_atual}`, 50, y);
        y += 15;
      });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }
}