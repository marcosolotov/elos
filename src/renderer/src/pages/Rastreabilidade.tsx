import { useState, useEffect } from 'react';
import { Card, Table, Timeline, Tag, message, Input, Button, Descriptions, Empty } from 'antd';
import { SearchOutlined, HistoryOutlined } from '@ant-design/icons';
import './Rastreabilidade.css';

const Rastreabilidade: React.FC = () => {
  const [lotes, setLotes] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState<any>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    carregarLotes();
  }, []);

  const carregarLotes = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.listarLotes();
      setLotes(data || []);
    } catch (error) {
      message.error('Erro ao carregar lotes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const consultarHistorico = async (loteId: string) => {
    setLoading(true);
    try {
      const data = await window.electronAPI.obterHistoricoLote(loteId);
      setHistorico(data || []);
      
      const lote = lotes.find(l => l.id === loteId);
      setLoteSelecionado(lote);
    } catch (error) {
      message.error('Erro ao carregar histórico');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLotes = lotes.filter((lote) =>
    lote.codigo_lote.toLowerCase().includes(searchText.toLowerCase()) ||
    lote.item_nome?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Código do Lote',
      dataIndex: 'codigo_lote',
      key: 'codigo_lote',
    },
    {
      title: 'Item',
      dataIndex: 'item_nome',
      key: 'item_nome',
      ellipsis: true,
    },
    {
      title: 'Data Validade',
      dataIndex: 'data_validade',
      key: 'data_validade',
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Saldo Atual',
      dataIndex: 'saldo_atual',
      key: 'saldo_atual',
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Ação',
      key: 'acao',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          icon={<HistoryOutlined />}
          onClick={() => consultarHistorico(record.id)}
        >
          Ver Histórico
        </Button>
      ),
    },
  ];

  const timelineItems = historico.map((mov: any, index: number) => {
    let cor = 'blue';
    if (mov.tipo === 'entrada') cor = 'green';
    else if (mov.tipo === 'saida') cor = 'orange';
    else if (mov.tipo === 'perda') cor = 'red';

    return {
      color: cor,
      children: (
        <div>
          <Tag color={cor}>{mov.tipo?.toUpperCase()}</Tag>
          <strong>Quantidade:</strong> {mov.quantidade?.toFixed(2)}
          {mov.motivo && <div><strong>Motivo:</strong> {mov.motivo}</div>}
          {mov.usuario_nome && <div><strong>Usuário:</strong> {mov.usuario_nome}</div>}
          <div style={{ color: '#999', fontSize: 12 }}>
            {new Date(mov.data).toLocaleString('pt-BR')}
          </div>
        </div>
      ),
    };
  });

  return (
    <div className="rastreabilidade-page">
      <h1 style={{ marginBottom: 24 }}>Rastreabilidade de Lotes</h1>

      {/* Busca de Lotes */}
      <Card title="Buscar Lote" style={{ marginBottom: 24 }}>
        <Input
          placeholder="Buscar por código do lote ou nome do item..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="large"
        />
      </Card>

      {/* Lista de Lotes */}
      <Card title="Lotes Disponíveis" style={{ marginBottom: 24 }}>
        <Table
          columns={columns}
          dataSource={filteredLotes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* Histórico do Lote Selecionado */}
      {loteSelecionado && (
        <Card 
          title={`Histórico do Lote: ${loteSelecionado.codigo_lote}`}
          extra={
            <Button onClick={() => {
              setLoteSelecionado(null);
              setHistorico([]);
            }}>
              Fechar
            </Button>
          }
        >
          <Descriptions title="Informações do Lote" bordered size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Item">{loteSelecionado.item_nome}</Descriptions.Item>
            <Descriptions.Item label="Código">{loteSelecionado.codigo_lote}</Descriptions.Item>
            <Descriptions.Item label="Data Validade">
              {new Date(loteSelecionado.data_validade).toLocaleDateString('pt-BR')}
            </Descriptions.Item>
            <Descriptions.Item label="Saldo Atual">{loteSelecionado.saldo_atual?.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="Quantidade Inicial">
              {loteSelecionado.quantidade_inicial?.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Data Entrada">
              {new Date(loteSelecionado.data_entrada).toLocaleDateString('pt-BR')}
            </Descriptions.Item>
          </Descriptions>

          {historico.length === 0 ? (
            <Empty description="Nenhuma movimentação registrada para este lote" />
          ) : (
            <Timeline items={timelineItems} />
          )}
        </Card>
      )}
    </div>
  );
};

export default Rastreabilidade;