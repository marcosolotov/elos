import Database from 'better-sqlite3';
import { Item, GrupoCategoria, Fornecedor } from '../../../shared/types';

export class ItemRepository {
  constructor(private db: Database.Database) {}

  listarTodos(): Item[] {
    const stmt = this.db.prepare(`
      SELECT i.*, 
             gc.nome as grupo_nome,
             cat.nome as categoria_nome
      FROM item i
      LEFT JOIN grupo_categoria gc ON i.grupo_id = gc.id
      LEFT JOIN grupo_categoria cat ON i.categoria_id = cat.id
      ORDER BY i.nome
    `);
    return stmt.all() as Item[];
  }

  buscarPorId(id: string): Item | null {
    const stmt = this.db.prepare('SELECT * FROM item WHERE id = ?');
    return (stmt.get(id) as Item) || null;
  }

  buscarPorNome(nome: string): Item[] {
    const stmt = this.db.prepare('SELECT * FROM item WHERE nome LIKE ? ORDER BY nome');
    return stmt.all(`%${nome}%`) as Item[];
  }

  criar(item: Omit<Item, 'created_at' | 'updated_at'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO item (id, nome, descricao, grupo_id, categoria_id, estoque_minimo, unidade_medida, porcao_padrao_g, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    stmt.run(item.id, item.nome, item.descricao || null, item.grupo_id || null, item.categoria_id || null, item.estoque_minimo, item.unidade_medida, item.porcao_padrao_g || null, now, now);
  }

  atualizar(id: string, item: Partial<Item>): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (item.nome !== undefined) { updates.push('nome = ?'); values.push(item.nome); }
    if (item.descricao !== undefined) { updates.push('descricao = ?'); values.push(item.descricao); }
    if (item.grupo_id !== undefined) { updates.push('grupo_id = ?'); values.push(item.grupo_id); }
    if (item.categoria_id !== undefined) { updates.push('categoria_id = ?'); values.push(item.categoria_id); }
    if (item.estoque_minimo !== undefined) { updates.push('estoque_minimo = ?'); values.push(item.estoque_minimo); }
    if (item.unidade_medida !== undefined) { updates.push('unidade_medida = ?'); values.push(item.unidade_medida); }
    if (item.porcao_padrao_g !== undefined) { updates.push('porcao_padrao_g = ?'); values.push(item.porcao_padrao_g); }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`UPDATE item SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  excluir(id: string): void {
    const stmt = this.db.prepare('DELETE FROM item WHERE id = ?');
    stmt.run(id);
  }

  // Grupo/Categoria methods
  listarGruposCategorias(tipo?: 'grupo' | 'categoria'): GrupoCategoria[] {
    let query = 'SELECT * FROM grupo_categoria';
    if (tipo) {
      query += ' WHERE tipo = ?';
      return this.db.prepare(query).all(tipo) as GrupoCategoria[];
    }
    return this.db.prepare(query).all() as GrupoCategoria[];
  }

  criarGrupoCategoria(gc: Omit<GrupoCategoria, 'created_at'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO grupo_categoria (id, nome, tipo, pai_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(gc.id, gc.nome, gc.tipo, gc.pai_id || null, new Date().toISOString());
  }

  // Fornecedor methods
  listarFornecedores(): Fornecedor[] {
    const stmt = this.db.prepare('SELECT * FROM fornecedor ORDER BY nome');
    return stmt.all() as Fornecedor[];
  }

  criarFornecedor(fornecedor: Omit<Fornecedor, 'created_at'>): void {
    const stmt = this.db.prepare(`
      INSERT INTO fornecedor (id, nome, cnpj, contato, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(fornecedor.id, fornecedor.nome, fornecedor.cnpj || null, fornecedor.contato || null, new Date().toISOString());
  }
}