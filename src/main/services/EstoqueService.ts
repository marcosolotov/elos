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
    repo.excluir(id);
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
    const novaMovimentacao: Movimentacao = {
      ...movimentacao,
      id: uuidv4(),
      data: new Date(),
      created_at: new Date(),
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
    const novaMovimentacao: Movimentacao = {
      ...movimentacao,
      id: uuidv4(),
      data: new Date(),
      created_at: new Date(),
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
}