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

  finalizarInventario(id: string): void {
    const db = this.db.getDatabase();
    const stmt = db.prepare('UPDATE inventario SET status = ?, data_fechamento = ? WHERE id = ?');
    stmt.run('fechado', new Date().toISOString(), id);
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
      SELECT m.*, l.codigo_lote, i.nome as item_nome
      FROM movimentacao m
      JOIN lote l ON m.lote_id = l.id
      JOIN item i ON l.item_id = i.id
      WHERE m.tipo = 'saida'
      ORDER BY m.data DESC
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