import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Popconfirm, DatePicker, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './Inventario.css';

const { Option } = Select;
const { TextArea } = Input;

interface Inventario {
  id: string;
  data_abertura: string;
  status: 'aberto' | 'fechado';
  usuario_id: string;
  data_fechamento?: string;
  created_at: string;
}

interface ItemInventario {
  id: string;
  inventario_id: string;
  item_id: string;
  quantidade_sistema: number;
  quantidade_contada: number | null;
  divergencia: number | null;
  motivo_ajuste?: string | null;
  item_nome?: string;
}

const Inventario: React.FC = () => {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [itensInventario, setItensInventario] = useState<ItemInventario[]>([]);
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [contagemModalVisible, setContagemModalVisible] = useState(false);
  const [itemContagem, setItemContagem] = useState<any>(null);
  const [inventarioSelecionado, setInventarioSelecionado] = useState<Inventario | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    carregarInventarios();
    carregarItens();
  }, []);

  const carregarInventarios = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.listarInventarios();
      setInventarios(data || []);
    } catch (error) {
      message.error('Erro ao carregar inventários');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const carregarItens = async () => {
    try {
      const data = await window.electronAPI.listarItens();
      setItens(data || []);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  const handleAbrirInventario = async () => {
    try {
      const adminUserId = 'admin';
      const novoInventario = await window.electronAPI.abrirInventario({
        data_abertura: new Date().toISOString(),
        status: 'aberto',
        usuario_id: adminUserId,
      });
      message.success('Inventário aberto com sucesso');
      carregarInventarios();
    } catch (error) {
      message.error('Erro ao abrir inventário');
      console.error(error);
    }
  };

  const handleFinalizarInventario = async (id: string) => {
    try {
      const resultado = await window.electronAPI.finalizarInventario(id);
      
      if (resultado.ajustes && resultado.ajustes.length > 0) {
        // Mostrar relatório de ajustes
        const saidas = resultado.ajustes.filter((a: any) => a.tipo === 'saida');
        const entradas = resultado.ajustes.filter((a: any) => a.tipo === 'entrada');
        
        Modal.info({
          title: 'Inventário Finalizado - Ajustes Automáticos',
          width: 700,
          content: (
            <div>
              <p style={{ marginBottom: 16 }}>
                Foram realizados <strong>{resultado.ajustes.length}</strong> ajustes automáticos no estoque.
              </p>
              
              {saidas.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: '#cf1322' }}>🔻 Saídas (itens que faltaram): {saidas.length}</h4>
                  <Table
                    dataSource={saidas}
                    columns={[
                      { title: 'Item', dataIndex: 'item_nome', key: 'item_nome' },
                      { title: 'Lote', dataIndex: 'codigo_lote', key: 'codigo_lote' },
                      { title: 'Qtd', dataIndex: 'quantidade', key: 'quantidade', render: (v: number) => v.toFixed(2) },
                      { title: 'Saldo Anterior', dataIndex: 'saldo_anterior', key: 'saldo_anterior', render: (v: number) => v.toFixed(2) },
                      { title: 'Novo Saldo', dataIndex: 'novo_saldo', key: 'novo_saldo', render: (v: number) => v.toFixed(2) },
                    ]}
                    rowKey="lote_id"
                    pagination={false}
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                </div>
              )}
              
              {entradas.length > 0 && (
                <div>
                  <h4 style={{ color: '#389e0d' }}>🔺 Entradas (itens que sobraram): {entradas.length}</h4>
                  <Table
                    dataSource={entradas}
                    columns={[
                      { title: 'Item', dataIndex: 'item_nome', key: 'item_nome' },
                      { title: 'Lote', dataIndex: 'codigo_lote', key: 'codigo_lote' },
                      { title: 'Qtd', dataIndex: 'quantidade', key: 'quantidade', render: (v: number) => v.toFixed(2) },
                      { title: 'Saldo Anterior', dataIndex: 'saldo_anterior', key: 'saldo_anterior', render: (v: number) => v.toFixed(2) },
                      { title: 'Novo Saldo', dataIndex: 'novo_saldo', key: 'novo_saldo', render: (v: number) => v.toFixed(2) },
                    ]}
                    rowKey="lote_id"
                    pagination={false}
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                </div>
              )}
            </div>
          ),
        });
      } else {
        message.success('Inventário finalizado com sucesso. Nenhum ajuste foi necessário.');
      }
      
      carregarInventarios();
      setInventarioSelecionado(null);
      setItensInventario([]);
    } catch (error) {
      message.error('Erro ao finalizar inventário');
      console.error(error);
    }
  };

  const handleSelecionarInventario = async (inventario: Inventario) => {
    setInventarioSelecionado(inventario);
    // Carregar itens do inventário
    try {
      const data = await window.electronAPI.listarItensInventario(inventario.id);
      setItensInventario(data || []);
    } catch (error) {
      console.error('Erro ao carregar itens do inventário:', error);
      setItensInventario([]);
    }
  };

  const handleIniciarContagem = async () => {
    if (!inventarioSelecionado) return;
    
    try {
      // Criar itens de inventário para todos os itens ativos
      const lotes = await window.electronAPI.listarLotes();
      
      // Agrupar por item
      const itensMap = new Map();
      lotes.forEach((lote: any) => {
        if (!itensMap.has(lote.item_id)) {
          itensMap.set(lote.item_id, {
            item_id: lote.item_id,
            item_nome: lote.item_nome,
            quantidade_sistema: 0,
          });
        }
        itensMap.get(lote.item_id).quantidade_sistema += lote.saldo_atual;
      });

      // Criar itens de inventário
      const itensParaContar = Array.from(itensMap.values()).map((item: any) => ({
        id: '',
        inventario_id: inventarioSelecionado.id,
        item_id: item.item_id,
        quantidade_sistema: item.quantidade_sistema,
        quantidade_contada: null,
        divergencia: null,
        motivo_ajuste: null,
        item_nome: item.item_nome,
      }));

      setItensInventario(itensParaContar);
      message.success(`${itensParaContar.length} itens carregados para contagem`);
    } catch (error) {
      message.error('Erro ao iniciar contagem');
      console.error(error);
    }
  };

  const handleEditarContagem = (item: ItemInventario) => {
    setItemContagem(item);
    form.setFieldsValue({
      quantidade_contada: item.quantidade_contada,
      motivo_ajuste: item.motivo_ajuste,
    });
    setContagemModalVisible(true);
  };

  const handleSalvarContagem = async (values: any) => {
    if (!itemContagem || !inventarioSelecionado) return;

    try {
      const divergencia = values.quantidade_contada - itemContagem.quantidade_sistema;
      
      await window.electronAPI.salvarContagem({
        inventario_id: inventarioSelecionado.id,
        item_id: itemContagem.item_id,
        quantidade_contada: values.quantidade_contada,
        motivo_ajuste: values.motivo_ajuste,
      });

      // Atualizar lista local
      setItensInventario(prev => prev.map(item => 
        item.item_id === itemContagem.item_id 
          ? { ...item, quantidade_contada: values.quantidade_contada, divergencia, motivo_ajuste: values.motivo_ajuste }
          : item
      ));

      message.success('Contagem registrada com sucesso');
      setContagemModalVisible(false);
    } catch (error) {
      message.error('Erro ao salvar contagem');
      console.error(error);
    }
  };

  const inventarioColumns = [
    {
      title: 'Data Abertura',
      dataIndex: 'data_abertura',
      key: 'data_abertura',
      render: (date: string) => new Date(date).toLocaleString('pt-BR'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'aberto' ? 'blue' : 'green'}>
          {status === 'aberto' ? 'Aberto' : 'Fechado'}
        </Tag>
      ),
    },
    {
      title: 'Data Fechamento',
      dataIndex: 'data_fechamento',
      key: 'data_fechamento',
      render: (date?: string) => date ? new Date(date).toLocaleString('pt-BR') : '-',
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: Inventario) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<SearchOutlined />}
            onClick={() => handleSelecionarInventario(record)}
          >
            Ver Itens
          </Button>
          {record.status === 'aberto' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleFinalizarInventario(record.id)}
              >
                Finalizar
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const itensInventarioColumns = [
    {
      title: 'Item',
      dataIndex: 'item_nome',
      key: 'item_nome',
      ellipsis: true,
    },
    {
      title: 'Qtd Sistema',
      dataIndex: 'quantidade_sistema',
      key: 'quantidade_sistema',
      width: 120,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Qtd Contada',
      dataIndex: 'quantidade_contada',
      key: 'quantidade_contada',
      width: 120,
      render: (value: number) => value?.toFixed(2) || '-',
    },
    {
      title: 'Divergência',
      dataIndex: 'divergencia',
      key: 'divergencia',
      width: 120,
      render: (value: number) => {
        if (value === null || value === undefined) return '-';
        const color = value === 0 ? 'green' : value > 0 ? 'orange' : 'red';
        return <Tag color={color}>{value.toFixed(2)}</Tag>;
      },
    },
    {
      title: 'Motivo Ajuste',
      dataIndex: 'motivo_ajuste',
      key: 'motivo_ajuste',
      ellipsis: true,
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 120,
      render: (_: any, record: ItemInventario) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditarContagem(record)}
        >
          Contar
        </Button>
      ),
    },
  ];

  return (
    <div className="inventario-page">
      <h1 style={{ marginBottom: 24 }}>Controle de Inventário</h1>

      {/* Ações */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAbrirInventario}>
            Abrir Novo Inventário
          </Button>
          <Button icon={<SearchOutlined />} onClick={carregarInventarios}>
            Atualizar Lista
          </Button>
        </Space>
      </Card>

      {/* Lista de Inventários */}
      <Card title="Inventários" style={{ marginBottom: 24 }}>
        <Table
          columns={inventarioColumns}
          dataSource={inventarios}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Itens do Inventário Selecionado */}
      {inventarioSelecionado && (
        <Card 
          title={`Itens do Inventário - ${new Date(inventarioSelecionado.data_abertura).toLocaleDateString('pt-BR')}`}
          extra={
            <Space>
              <Button type="primary" onClick={handleIniciarContagem}>
                Iniciar Contagem
              </Button>
            </Space>
          }
        >
          {itensInventario.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Nenhum item contado ainda</p>
              <Button type="primary" onClick={handleIniciarContagem}>
                Iniciar Contagem
              </Button>
            </div>
          ) : (
            <Table
              columns={itensInventarioColumns}
              dataSource={itensInventario}
              rowKey="item_id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      )}

      {/* Modal de Contagem */}
      <Modal
        title={`Contagem: ${itemContagem?.item_nome || ''}`}
        open={contagemModalVisible}
        onCancel={() => setContagemModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSalvarContagem}
        >
          <Form.Item
            name="quantidade_contada"
            label="Quantidade Contada"
            rules={[{ required: true, message: 'Informe a quantidade contada' }]}
          >
            <InputNumber
              min="0"
              step="0.01"
              precision={2}
              style={{ width: '100%' }}
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            name="motivo_ajuste"
            label="Motivo do Ajuste (se houver divergência)"
          >
            <TextArea rows={3} placeholder="Descreva o motivo da divergência..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setContagemModalVisible(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit">
                Salvar Contagem
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Inventario;