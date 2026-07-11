import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Statistic, Row, Col, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons';
import './Perdas.css';

const { Option } = Select;
const { TextArea } = Input;

interface Perda {
  id: string;
  lote_id: string;
  quantidade: number;
  motivo: string;
  data: string;
  usuario_id: string;
  created_at: string;
  item_nome?: string;
  lote_codigo?: string;
}

const Perdas: React.FC = () => {
  const [perdas, setPerdas] = useState<Perda[]>([]);
  const [itens, setItens] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [itensData, lotesData] = await Promise.all([
        window.electronAPI.listarItens(),
        window.electronAPI.listarLotes(),
      ]);
      setItens(itensData || []);
      setLotes(lotesData || []);
      // Carregar perdas (implementar backend)
      setPerdas([]);
    } catch (error) {
      message.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Implementar cadastro no backend
      message.success('Perda registrada com sucesso');
      setModalVisible(false);
      form.resetFields();
      carregarDados();
    } catch (error) {
      message.error('Erro ao registrar perda');
      console.error(error);
    }
  };

  const totalPerdas = perdas.reduce((sum, p) => sum + p.quantidade, 0);
  const perdasPorMotivo = perdas.reduce((acc, p) => {
    acc[p.motivo] = (acc[p.motivo] || 0) + p.quantidade;
    return acc;
  }, {} as Record<string, number>);

  const columns = [
    {
      title: 'Item',
      dataIndex: 'item_nome',
      key: 'item_nome',
      ellipsis: true,
    },
    {
      title: 'Lote',
      dataIndex: 'lote_codigo',
      key: 'lote_codigo',
      width: 150,
    },
    {
      title: 'Quantidade',
      dataIndex: 'quantidade',
      key: 'quantidade',
      width: 120,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Motivo',
      dataIndex: 'motivo',
      key: 'motivo',
      width: 150,
      render: (motivo: string) => {
        let color = 'default';
        if (motivo === 'Vencimento') color = 'red';
        else if (motivo === 'Quebra') color = 'orange';
        else if (motivo === 'Descarte') color = 'purple';
        return <Tag color={color}>{motivo}</Tag>;
      },
    },
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString('pt-BR'),
    },
  ];

  return (
    <div className="perdas-page">
      <h1 style={{ marginBottom: 24 }}>Controle de Perdas e Desperdício</h1>

      {/* Estatísticas */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total de Perdas"
              value={totalPerdas}
              suffix="un"
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Registros de Perda"
              value={perdas.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Média por Registro"
              value={perdas.length > 0 ? totalPerdas / perdas.length : 0}
              suffix="un"
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Ações */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Registrar Perda
          </Button>
          <Button icon={<SearchOutlined />} onClick={carregarDados}>
            Atualizar
          </Button>
        </Space>
      </Card>

      {/* Tabela de Perdas */}
      <Card title="Histórico de Perdas">
        <Table
          columns={columns}
          dataSource={perdas}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* Modal de Registro */}
      <Modal
        title="Registrar Perda"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="lote_id"
            label="Lote"
            rules={[{ required: true, message: 'Por favor, selecione o lote' }]}
          >
            <Select placeholder="Selecione o lote...">
              {lotes.map((lote) => (
                <Option key={lote.id} value={lote.id}>
                  {lote.codigo_lote} - {lote.item_nome} (Saldo: {lote.saldo_atual?.toFixed(2)})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantidade"
            label="Quantidade"
            rules={[{ required: true, message: 'Por favor, insira a quantidade' }]}
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
            name="motivo"
            label="Motivo da Perda"
            rules={[{ required: true, message: 'Por favor, selecione o motivo' }]}
          >
            <Select placeholder="Selecione o motivo...">
              <Option value="Vencimento">Vencimento</Option>
              <Option value="Quebra">Quebra</Option>
              <Option value="Descarte">Descarte</Option>
              <Option value="Outro">Outro</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="observacao"
            label="Observação"
          >
            <TextArea rows={3} placeholder="Detalhes adicionais sobre a perda..." />
          </Form.Item>

          <Form.Item className="form-actions">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit">
                Registrar Perda
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Perdas;