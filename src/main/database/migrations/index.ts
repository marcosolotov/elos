import Database from 'better-sqlite3';

export async function runMigrations(db: Database.Database): Promise<void> {
  const version = db.pragma('user_version', { simple: true }) as number;
  
  if (version < 1) {
    await migrationV1(db);
  }
  
  // Future migrations can be added here
  // if (version < 2) { await migrationV2(db); }
}

async function migrationV1(db: Database.Database): Promise<void> {
  db.exec(`
    -- Tabela de usuários
    CREATE TABLE IF NOT EXISTS usuario (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      perfil TEXT NOT NULL CHECK(perfil IN ('admin', 'gerente', 'estoquista', 'operador')),
      login TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Tabela de grupos e categorias
    CREATE TABLE IF NOT EXISTS grupo_categoria (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('grupo', 'categoria')),
      pai_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (pai_id) REFERENCES grupo_categoria(id)
    );

    -- Tabela de fornecedores
    CREATE TABLE IF NOT EXISTS fornecedor (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cnpj TEXT,
      contato TEXT,
      created_at TEXT NOT NULL
    );

    -- Tabela de itens
    CREATE TABLE IF NOT EXISTS item (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      descricao TEXT,
      grupo_id TEXT,
      categoria_id TEXT,
      estoque_minimo REAL NOT NULL DEFAULT 0,
      unidade_medida TEXT NOT NULL,
      porcao_padrao_g REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (grupo_id) REFERENCES grupo_categoria(id),
      FOREIGN KEY (categoria_id) REFERENCES grupo_categoria(id)
    );

    -- Tabela de lotes
    CREATE TABLE IF NOT EXISTS lote (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      codigo_lote TEXT NOT NULL,
      data_fabricacao TEXT,
      data_validade TEXT NOT NULL,
      quantidade_inicial REAL NOT NULL,
      saldo_atual REAL NOT NULL,
      fornecedor_id TEXT,
      data_entrada TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES item(id),
      FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(id),
      UNIQUE(item_id, codigo_lote)
    );

    -- Tabela de movimentações
    CREATE TABLE IF NOT EXISTS movimentacao (
      id TEXT PRIMARY KEY,
      lote_id TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'saida', 'perda')),
      quantidade REAL NOT NULL,
      data TEXT NOT NULL,
      usuario_id TEXT NOT NULL,
      motivo TEXT,
      documento_referencia TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lote_id) REFERENCES lote(id),
      FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    );

    -- Tabela de perdas e desperdícios
    CREATE TABLE IF NOT EXISTS perda_desperdicio (
      id TEXT PRIMARY KEY,
      lote_id TEXT NOT NULL,
      quantidade REAL NOT NULL,
      motivo TEXT NOT NULL,
      data TEXT NOT NULL,
      usuario_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lote_id) REFERENCES lote(id),
      FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    );

    -- Tabela de rendimento
    CREATE TABLE IF NOT EXISTS rendimento (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      data TEXT NOT NULL,
      qtd_entrada REAL NOT NULL,
      qtd_saida REAL NOT NULL,
      percentual REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES item(id)
    );

    -- Tabela de inventário
    CREATE TABLE IF NOT EXISTS inventario (
      id TEXT PRIMARY KEY,
      data_abertura TEXT NOT NULL,
      data_fechamento TEXT,
      status TEXT NOT NULL CHECK(status IN ('aberto', 'fechado')),
      usuario_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    );

    -- Tabela de itens de inventário
    CREATE TABLE IF NOT EXISTS item_inventario (
      id TEXT PRIMARY KEY,
      inventario_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      saldo_esperado REAL NOT NULL,
      saldo_contado REAL,
      divergencia REAL,
      motivo_ajuste TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (inventario_id) REFERENCES inventario(id),
      FOREIGN KEY (item_id) REFERENCES item(id)
    );

    -- Tabela de lista de compras
    CREATE TABLE IF NOT EXISTS lista_compra (
      id TEXT PRIMARY KEY,
      data_geracao TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('aberta', 'finalizada')),
      created_at TEXT NOT NULL
    );

    -- Tabela de itens de lista de compras
    CREATE TABLE IF NOT EXISTS item_lista_compra (
      id TEXT PRIMARY KEY,
      lista_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantidade_sugerida REAL NOT NULL,
      quantidade_ajustada REAL,
      incluido_manualmente INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lista_id) REFERENCES lista_compra(id),
      FOREIGN KEY (item_id) REFERENCES item(id)
    );

    -- Tabela de etiquetas QR Code
    CREATE TABLE IF NOT EXISTS etiqueta_qrcode (
      id TEXT PRIMARY KEY,
      lote_id TEXT NOT NULL,
      codigo_unico TEXT UNIQUE NOT NULL,
      data_geracao TEXT NOT NULL,
      impresso INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (lote_id) REFERENCES lote(id)
    );

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_lote_item_id ON lote(item_id);
    CREATE INDEX IF NOT EXISTS idx_lote_codigo ON lote(codigo_lote);
    CREATE INDEX IF NOT EXISTS idx_movimentacao_lote_id ON movimentacao(lote_id);
    CREATE INDEX IF NOT EXISTS idx_movimentacao_data ON movimentacao(data);
    CREATE INDEX IF NOT EXISTS idx_etiqueta_codigo ON etiqueta_qrcode(codigo_unico);
    CREATE INDEX IF NOT EXISTS idx_item_grupo ON item(grupo_id);
    CREATE INDEX IF NOT EXISTS idx_item_categoria ON item(categoria_id);
  `);

  // Set migration version
  db.pragma('user_version = 1');
  
  console.log('Migration v1 completed');
}