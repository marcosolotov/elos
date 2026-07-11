export interface Item {
  id: string;
  nome: string;
  descricao?: string;
  grupo_id?: string;
  categoria_id?: string;
  estoque_minimo: number;
  unidade_medida: string;
  porcao_padrao_g?: number;
  created_at: Date;
  updated_at: Date;
}

export interface GrupoCategoria {
  id: string;
  nome: string;
  tipo: 'grupo' | 'categoria';
  pai_id?: string;
  created_at: Date;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  contato?: string;
  created_at: Date;
}

export interface Usuario {
  id: string;
  nome: string;
  perfil: 'admin' | 'gerente' | 'estoquista' | 'operador';
  login: string;
  senha_hash: string;
  created_at: Date;
}

export interface Lote {
  id: string;
  item_id: string;
  codigo_lote: string;
  data_fabricacao?: Date;
  data_validade: Date;
  quantidade_inicial: number;
  saldo_atual: number;
  fornecedor_id?: string;
  data_entrada: Date;
  ativo: boolean;
  created_at: Date;
}

export interface Movimentacao {
  id: string;
  lote_id: string;
  tipo: 'entrada' | 'saida' | 'perda';
  quantidade: number;
  data: Date;
  usuario_id: string;
  motivo?: string;
  documento_referencia?: string;
  created_at: Date;
}

export interface PerdaDesperdicio {
  id: string;
  lote_id: string;
  quantidade: number;
  motivo: string;
  data: Date;
  usuario_id: string;
  created_at: Date;
}

export interface Rendimento {
  id: string;
  item_id: string;
  data: Date;
  qtd_entrada: number;
  qtd_saida: number;
  percentual: number;
  created_at: Date;
}

export interface Inventario {
  id: string;
  data_abertura: Date;
  data_fechamento?: Date;
  status: 'aberto' | 'fechado';
  usuario_id: string;
  created_at: Date;
}

export interface ItemInventario {
  id: string;
  inventario_id: string;
  item_id: string;
  saldo_esperado: number;
  saldo_contado?: number;
  divergencia?: number;
  motivo_ajuste?: string;
  created_at: Date;
}

export interface ListaCompra {
  id: string;
  data_geracao: Date;
  status: 'aberta' | 'finalizada';
  created_at: Date;
}

export interface ItemListaCompra {
  id: string;
  lista_id: string;
  item_id: string;
  quantidade_sugerida: number;
  quantidade_ajustada?: number;
  incluido_manualmente: boolean;
  created_at: Date;
}

export interface EtiquetaQRCode {
  id: string;
  lote_id: string;
  codigo_unico: string;
  data_geracao: Date;
  impresso: boolean;
}

export interface ItemComSaldo extends Item {
  saldo_total: number;
  lote_count: number;
}

export interface AlertaValidade {
  lote_id: string;
  item_nome: string;
  codigo_lote: string;
  data_validade: Date;
  dias_para_vencer: number;
  saldo_atual: number;
  urgencia: 'critica' | 'alta' | 'media' | 'baixa';
}