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
  quantidade_contada: number;
  divergencia: number;
  motivo_ajuste?: string;
  item_nome?: string;
}

const Inventario: React.FC = () => {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [itensInventario, setItensInventario] = useState<ItemInventario[]>([]);
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [inventarioSelecionado, setInventarioSelecionado] = useState<Inventario | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    carregarInventarios();
  }, []);

  const carregarInventarios = async () => {
    setLoading(true);
    try {
      // Carregar lista de inventários (implementar backend)
      setInventarios([]);
    } catch (error) {
      message.error('Erro ao carregar inventários');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirInventario = async () => {
    try {
      const novoInventario = await window.electronAPI.abrirInventario({
        data_abertura: new Date().toISOString(),
        status: 'aberto',
        usuario_id: 'usuario_atual',
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
      await window.electronAPI.finalizarInventario(id);
      message.success('Inventário finalizado com sucesso');
      carregarInventarios();
    } catch (error) {
      message.error('Erro ao finalizar inventário');
      console.error(error);
    }
  };

  const handleSelecionarInventario = async (inventario: Inventario) => {
    setInventarioSelecionado(inventario);
    // Carregar itens do inventário (implementar backend)
    setItensInventario([]);
  };

  const handleRegistrarContagem = () => {
    // Implementar modal de contagem
    message.info('Funcionalidade de contagem em desenvolvimento');
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
              <Popconfirm
                title="Tem certeza que deseja excluir este inventário?"
                onConfirm={() => handleFinalizarInventario(record.id)}
                okText="Sim"
                cancelText="Não"
              >
                <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
              </Popconfirm>
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
        if (!value) return '-';
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
              <Button type="primary" onClick={handleRegistrarContagem}>
                Registrar Contagem
              </Button>
            </Space>
          }
        >
          {itensInventario.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Nenhum item contado ainda</p>
              <Button type="primary" onClick={handleRegistrarContagem}>
                Iniciar Contagem
              </Button>
            </div>
          ) : (
            <Table
              columns={itensInventarioColumns}
              dataSource={itensInventario}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default Inventario;