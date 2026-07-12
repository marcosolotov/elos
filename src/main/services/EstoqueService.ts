import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/DatabaseService';
import { Item, Lote, Movimentacao, Inventario, ItemInventario } from '../../shared/types';

export class EstoqueService {
  constructor(private db: DatabaseService) {}

  listarItens(): Item[] {
    const repo = new (require('../database/repositories/ItemRepository').ItemRepository)(this.db.getDatabase());
    return repo.listarTodos();
  }

  cadastrarItem(item: Omit<Item, 'created_at' | 'updated_at'>): Item {
    const repo = new (require('../database/repositories/ItemRepository').ItemRepository)(this.db.getDatabase());
    const novoItem = {
      ...item,
      id: uuidv4(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    repo.criar(novoItem);
    return novoItem;
  }

  atualizarItem(id: string, item: Partial<Item>): void {
    const repo = new (require('../database/repositories/ItemRepository').ItemRepository)(this.db.getDatabase());
    repo.atualizar(id, item);
  }

  excluirItem(id: string): void {
    const repo = new (require('../database/repositories/ItemRepository').ItemRepository)(this.db.getDatabase());
    repo.inativar(id);
  }

  registrarEntrada(movimentacao: Omit<Movimentacao, 'id' | 'data' | 'created_at'>): Movimentacao {
    const db = this.db.getDatabase();
    const repoLote = new (require('../database/repositories/LoteRepository').LoteRepository)(db);
    
    // Buscar lote
    const lote = repoLote.buscarPorId(movimentacao.lote_id);
    if (!lote) {
      throw new Error('Lote não encontrado');
    }

    // Criar movimentação
    const agora = new Date();
    const novaMovimentacao: Movimentacao = {
      ...movimentacao,
      id: uuidv4(),
      data: agora,
      created_at: agora,
    };

    // Atualizar saldo do lote
    const novoSaldo = lote.saldo_atual + movimentacao.quantidade;
    repoLote.atualizarSaldo(lote.id, novoSaldo);
    repoLote.registrarMovimentacao(novaMovimentacao);

    return novaMovimentacao;
  }

  registrarSaida(movimentacao: Omit<Movimentacao, 'id' | 'data' | 'created_at'>): Movimentacao {
    const db = this.db.getDatabase();
    const repoLote = new (require('../database/repositories/LoteRepository').LoteRepository)(db);
    
    // Buscar lote
    const lote = repoLote.buscarPorId(movimentacao.lote_id);
    if (!lote) {
      throw new Error('Lote não encontrado');
    }

    // Validar saldo suficiente
    if (lote.saldo_atual < movimentacao.quantidade) {
      throw new Error(`Saldo insuficiente. Disponível: ${lote.saldo_atual}, Solicitado: ${movimentacao.quantidade}`);
    }

    // Criar movimentação
    const agora = new Date();
    const novaMovimentacao: Movimentacao = {
      ...movimentacao,
      id: uuidv4(),
      data: agora,
      created_at: agora,
    };

    // Atualizar saldo do lote
    const novoSaldo = lote.saldo_atual - movimentacao.quantidade;
    repoLote.atualizarSaldo(lote.id, novoSaldo);
    repoLote.registrarMovimentacao(novaMovimentacao);

    return novaMovimentacao;
  }

  listarMovimentacoesPorLote(loteId: string): Movimentacao[] {
    const repoLote = new (require('../database/repositories/LoteRepository').LoteRepository)(this.db.getDatabase());
    return repoLote.obterHistorico(loteId);
  }

  abrirInventario(inventario: Omit<Inventario, 'id' | 'created_at'>): Inventario {
    const db = this.db.getDatabase();
    const agora = new Date();
    const novoInventario: Inventario = {
      ...inventario,
      id: uuidv4(),
      data_abertura: agora,
      created_at: agora,
    };

    const stmt = db.prepare(`
      INSERT INTO inventario (id, data_abertura, status, usuario_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(novoInventario.id, novoInventario.data_abertura.toISOString(), novoInventario.status, 
             novoInventario.usuario_id, novoInventario.created_at.toISOString());

    // Criar itens de inventário automaticamente para todos os itens com saldo
    const repoLote = new (require('../database/repositories/LoteRepository').LoteRepository)(db);
    const lotes = repoLote.listarTodos();
    
    // Agrupar por item
    const itensMap = new Map();
    lotes.forEach((lote: any) => {
      if (!itensMap.has(lote.item_id)) {
        itensMap.set(lote.item_id, {
          item_id: lote.item_id,
          quantidade_sistema: 0,
        });
      }
      itensMap.get(lote.item_id).quantidade_sistema += lote.saldo_atual;
    });

    // Inserir itens de inventário
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO item_inventario (id, inventario_id, item_id, saldo_esperado, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    itensMap.forEach((item: any) => {
      insertStmt.run(uuidv4(), novoInventario.id, item.item_id, item.quantidade_sistema, new Date().toISOString());
    });

    return novoInventario;
  }

  finalizarInventario(id: string): { ajustes: any[] } {
    const db = this.db.getDatabase();
    const repoLote = new (require('../database/repositories/LoteRepository').LoteRepository)(db);
    const ajustes: any[] = [];

    // Buscar itens do inventário com divergência
    const itensInventario = this.listarItensInventario(id);
    
    // Usar transação para garantir consistência
    const transaction = db.transaction(() => {
      for (const item of itensInventario) {
        const esperado = item.saldo_esperado || 0;
        const contado = item.saldo_contado;
        
        // Pular itens que não foram contados
        if (contado === null || contado === undefined) continue;
        
        const divergencia = contado - esperado;
        
        if (divergencia === 0) continue;

        if (divergencia < 0) {
          // FALTOU → Dar saída nos lotes (FIFO: lote mais antigo primeiro)
          const quantidadeFaltante = Math.abs(divergencia);
          const lotesDoItem = repoLote.buscarPorItem(item.item_id);
          
          // Ordenar por data de validade (FIFO)
          lotesDoItem.sort((a: any, b: any) => 
            new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime()
          );

          let restante = quantidadeFaltante;
          for (const lote of lotesDoItem) {
            if (restante <= 0) break;
            if (lote.saldo_atual <= 0) continue;

            const quantidadeSaida = Math.min(restante, lote.saldo_atual);
            
            // Atualizar saldo do lote
            const novoSaldo = lote.saldo_atual - quantidadeSaida;
            repoLote.atualizarSaldo(lote.id, novoSaldo);

            // Registrar movimentação de saída
            const { v4: uuidv4 } = require('uuid');
            const mov = {
              id: uuidv4(),
              lote_id: lote.id,
              tipo: 'saida',
              quantidade: quantidadeSaida,
              data: new Date(),
              usuario_id: 'admin',
              motivo: 'Ajuste de Inventário - divergência negativa',
              documento_referencia: `Inventário #${id.slice(0, 8)}`,
              created_at: new Date(),
            };
            repoLote.registrarMovimentacao(mov);

            ajustes.push({
              tipo: 'saida',
              item_id: item.item_id,
              item_nome: item.item_nome,
              lote_id: lote.id,
              codigo_lote: lote.codigo_lote,
              quantidade: quantidadeSaida,
              saldo_anterior: lote.saldo_atual,
              novo_saldo: novoSaldo,
            });

            restante -= quantidadeSaida;
          }

          if (restante > 0) {
            console.warn(`[Inventário] Aviso: ${restante} unidades do item ${item.item_nome} não puderam ser ajustadas por falta de saldo nos lotes`);
          }
        } else {
          // SOBROU → Dar entrada nos lotes (distribuir entre lotes ativos)
          const quantidadeExcedente = divergencia;
          const lotesDoItem = repoLote.buscarPorItem(item.item_id);
          
          if (lotesDoItem.length === 0) continue;

          // Distribuir proporcionalmente entre todos os lotes ativos
          const totalSaldo = lotesDoItem.reduce((sum: number, l: any) => sum + l.saldo_atual, 0);
          
          if (totalSaldo === 0 && lotesDoItem.length > 0) {
            // Se todos os lotes estão com saldo 0, coloca no primeiro lote
            const lote = lotesDoItem[0];
            const novoSaldo = lote.saldo_atual + quantidadeExcedente;
            repoLote.atualizarSaldo(lote.id, novoSaldo);

            const { v4: uuidv4 } = require('uuid');
            repoLote.registrarMovimentacao({
              id: uuidv4(),
              lote_id: lote.id,
              tipo: 'entrada',
              quantidade: quantidadeExcedente,
              data: new Date(),
              usuario_id: 'admin',
              motivo: 'Ajuste de Inventário - divergência positiva',
              documento_referencia: `Inventário #${id.slice(0, 8)}`,
              created_at: new Date(),
            });

            ajustes.push({
              tipo: 'entrada',
              item_id: item.item_id,
              item_nome: item.item_nome,
              lote_id: lote.id,
              codigo_lote: lote.codigo_lote,
              quantidade: quantidadeExcedente,
              saldo_anterior: lote.saldo_atual,
              novo_saldo: novoSaldo,
            });
          } else {
            // Distribuir proporcionalmente
            let restante = quantidadeExcedente;
            for (let i = 0; i < lotesDoItem.length; i++) {
              if (restante <= 0) break;
              
              const lote = lotesDoItem[i];
              const proporcao = lote.saldo_atual / totalSaldo;
              const quantidadeEntrada = i === lotesDoItem.length - 1 
                ? restante  // Último lote pega o resto
                : Math.round(quantidadeExcedente * proporcao * 100) / 100;

              if (quantidadeEntrada <= 0) continue;

              const novoSaldo = lote.saldo_atual + quantidadeEntrada;
              repoLote.atualizarSaldo(lote.id, novoSaldo);

              const { v4: uuidv4 } = require('uuid');
              repoLote.registrarMovimentacao({
                id: uuidv4(),
                lote_id: lote.id,
                tipo: 'entrada',
                quantidade: quantidadeEntrada,
                data: new Date(),
                usuario_id: 'admin',
                motivo: 'Ajuste de Inventário - divergência positiva',
                documento_referencia: `Inventário #${id.slice(0, 8)}`,
                created_at: new Date(),
              });

              ajustes.push({
                tipo: 'entrada',
                item_id: item.item_id,
                item_nome: item.item_nome,
                lote_id: lote.id,
                codigo_lote: lote.codigo_lote,
                quantidade: quantidadeEntrada,
                saldo_anterior: lote.saldo_atual,
                novo_saldo: novoSaldo,
              });

              restante -= quantidadeEntrada;
            }
          }
        }
      }

      // Finalizar inventário
      const stmt = db.prepare('UPDATE inventario SET status = ?, data_fechamento = ? WHERE id = ?');
      stmt.run('fechado', new Date().toISOString(), id);
    });

    // Executar transação
    transaction();

    console.log(`[Inventário] Finalizado. Ajustes realizados:`, ajustes);
    
    return { ajustes };
  }

  listarGruposCategorias(tipo?: 'grupo' | 'categoria'): any[] {
    const repo = new (require('../database/repositories/ItemRepository').ItemRepository)(this.db.getDatabase());
    return repo.listarGruposCategorias(tipo);
  }

  criarGrupoCategoria(gc: any): void {
    const repo = new (require('../database/repositories/ItemRepository').ItemRepository)(this.db.getDatabase());
    repo.criarGrupoCategoria(gc);
  }

  listarFornecedores(): any[] {
    const repo = new (require('../database/repositories/ItemRepository').ItemRepository)(this.db.getDatabase());
    return repo.listarFornecedores();
  }

  criarFornecedor(fornecedor: any): void {
    const repo = new (require('../database/repositories/ItemRepository').ItemRepository)(this.db.getDatabase());
    repo.criarFornecedor(fornecedor);
  }

  listarInventarios(): any[] {
    const db = this.db.getDatabase();
    const stmt = db.prepare(`
      SELECT i.*, u.nome as usuario_nome
      FROM inventario i
      LEFT JOIN usuario u ON i.usuario_id = u.id
      ORDER BY i.data_abertura DESC
    `);
    return stmt.all();
  }

  listarSaidas(): any[] {
    const db = this.db.getDatabase();
    const stmt = db.prepare(`
      SELECT m.*, l.codigo_lote as lote_codigo, i.nome as item_nome
      FROM movimentacao m
      JOIN lote l ON m.lote_id = l.id
      JOIN item i ON l.item_id = i.id
      WHERE m.tipo = 'saida'
      ORDER BY m.data DESC
    `);
    return stmt.all();
  }

  // ========== LISTA DE COMPRAS ==========
  obterListaCompraAberta(): any {
    const db = this.db.getDatabase();
    const lista = db.prepare(`
      SELECT * FROM lista_compra WHERE status = 'aberta' ORDER BY data_geracao DESC LIMIT 1
    `).get() as any;
    return lista || null;
  }

  criarListaCompra(): any {
    const db = this.db.getDatabase();
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    const agora = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO lista_compra (id, data_geracao, status, created_at)
      VALUES (?, ?, 'aberta', ?)
    `).run(id, agora, agora);
    
    return { id, data_geracao: agora, status: 'aberta', created_at: agora };
  }

  listarItensListaCompra(listaId: string): any[] {
    const db = this.db.getDatabase();
    const stmt = db.prepare(`
      SELECT ic.*, i.nome as item_nome, i.estoque_minimo,
             COALESCE((SELECT SUM(l.saldo_atual) FROM lote l WHERE l.item_id = i.id AND l.ativo = 1), 0) as estoque_atual
      FROM item_lista_compra ic
      JOIN item i ON ic.item_id = i.id
      WHERE ic.lista_id = ?
      ORDER BY ic.created_at DESC
    `);
    return stmt.all(listaId) as any[];
  }

  adicionarItemListaCompra(dados: { lista_id: string; item_id: string; quantidade_sugerida: number; incluido_manualmente?: boolean }): void {
    const db = this.db.getDatabase();
    const { v4: uuidv4 } = require('uuid');
    
    // Verificar se item já está na lista
    const existente = db.prepare('SELECT id FROM item_lista_compra WHERE lista_id = ? AND item_id = ?').get(dados.lista_id, dados.item_id);
    if (existente) {
      throw new Error('Item já está na lista de compras');
    }

    db.prepare(`
      INSERT INTO item_lista_compra (id, lista_id, item_id, quantidade_sugerida, incluido_manualmente, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), dados.lista_id, dados.item_id, dados.quantidade_sugerida, dados.incluido_manualmente ? 1 : 0, new Date().toISOString());
  }

  finalizarListaCompra(listaId: string): void {
    const db = this.db.getDatabase();
    db.prepare('UPDATE lista_compra SET status = ? WHERE id = ?').run('finalizada', listaId);
  }

  listarSugestoesCompra(): any[] {
    const db = this.db.getDatabase();
    // Itens com estoque atual abaixo do mínimo
    const stmt = db.prepare(`
      SELECT i.id as item_id, i.nome as item_nome, i.estoque_minimo,
             COALESCE((SELECT SUM(l.saldo_atual) FROM lote l WHERE l.item_id = i.id AND l.ativo = 1), 0) as estoque_atual,
             CASE 
               WHEN COALESCE((SELECT SUM(l.saldo_atual) FROM lote l WHERE l.item_id = i.id AND l.ativo = 1), 0) = 0 THEN i.estoque_minimo
               ELSE i.estoque_minimo - COALESCE((SELECT SUM(l.saldo_atual) FROM lote l WHERE l.item_id = i.id AND l.ativo = 1), 0)
             END as quantidade_sugerida,
             'Estoque abaixo do mínimo' as motivo,
             CASE 
               WHEN COALESCE((SELECT SUM(l.saldo_atual) FROM lote l WHERE l.item_id = i.id AND l.ativo = 1), 0) = 0 THEN 'alta'
               WHEN COALESCE((SELECT SUM(l.saldo_atual) FROM lote l WHERE l.item_id = i.id AND l.ativo = 1), 0) < i.estoque_minimo / 2 THEN 'alta'
               ELSE 'media'
             END as prioridade
      FROM item i
      WHERE i.ativo = 1
        AND COALESCE((SELECT SUM(l.saldo_atual) FROM lote l WHERE l.item_id = i.id AND l.ativo = 1), 0) < i.estoque_minimo
      ORDER BY prioridade ASC, estoque_atual ASC
    `);
    return stmt.all() as any[];
  }

  listarPerdas(): any[] {
    const db = this.db.getDatabase();
    const stmt = db.prepare(`
      SELECT p.*, l.codigo_lote as lote_codigo, i.nome as item_nome
      FROM perda_desperdicio p
      JOIN lote l ON p.lote_id = l.id
      JOIN item i ON l.item_id = i.id
      ORDER BY p.data DESC
    `);
    return stmt.all();
  }

  registrarPerda(loteId: string, quantidade: number, motivo: string): void {
    const db = this.db.getDatabase();
    const repoLote = new (require('../database/repositories/LoteRepository').LoteRepository)(db);
    
    // Buscar lote
    const lote = repoLote.buscarPorId(loteId);
    if (!lote) {
      throw new Error('Lote não encontrado');
    }

    // Validar saldo suficiente
    if (lote.saldo_atual < quantidade) {
      throw new Error(`Saldo insuficiente. Disponível: ${lote.saldo_atual}, Solicitado: ${quantidade}`);
    }

    // Atualizar saldo do lote
    const novoSaldo = lote.saldo_atual - quantidade;
    repoLote.atualizarSaldo(loteId, novoSaldo);

    // Registrar perda
    const { v4: uuidv4 } = require('uuid');
    db.prepare(`
      INSERT INTO perda_desperdicio (id, lote_id, quantidade, motivo, data, usuario_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), loteId, quantidade, motivo, new Date().toISOString(), 'admin', new Date().toISOString());
  }

  listarItensInventario(inventarioId: string): any[] {
    const db = this.db.getDatabase();
    const stmt = db.prepare(`
      SELECT ii.*, i.nome as item_nome,
             ii.saldo_esperado as quantidade_sistema,
             ii.saldo_contado as quantidade_contada
      FROM item_inventario ii
      LEFT JOIN item i ON ii.item_id = i.id
      WHERE ii.inventario_id = ?
    `);
    return stmt.all(inventarioId);
  }

  salvarContagem(contagem: { inventario_id: string; item_id: string; quantidade_contada: number; motivo_ajuste?: string }): void {
    const db = this.db.getDatabase();
    
    // Verificar se já existe
    const existing: any = db.prepare('SELECT id, saldo_esperado FROM item_inventario WHERE inventario_id = ? AND item_id = ?')
      .get(contagem.inventario_id, contagem.item_id);
    
    if (existing) {
      // Calcular divergência
      const divergencia = contagem.quantidade_contada - (existing.saldo_esperado || 0);
      
      // Atualizar
      db.prepare(`
        UPDATE item_inventario 
        SET saldo_contado = ?, divergencia = ?, motivo_ajuste = ?
        WHERE inventario_id = ? AND item_id = ?
      `).run(contagem.quantidade_contada, divergencia, contagem.motivo_ajuste || null, contagem.inventario_id, contagem.item_id);
    } else {
      // Inserir
      const { v4: uuidv4 } = require('uuid');
      db.prepare(`
        INSERT INTO item_inventario (id, inventario_id, item_id, saldo_esperado, saldo_contado, motivo_ajuste, created_at)
        VALUES (?, ?, ?, 0, ?, ?, ?)
      `).run(uuidv4(), contagem.inventario_id, contagem.item_id, contagem.quantidade_contada, contagem.motivo_ajuste || null, new Date().toISOString());
    }
  }
}