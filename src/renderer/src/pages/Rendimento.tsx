import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Statistic, Row, Col, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, RiseOutlined } from '@ant-design/icons';
import './Rendimento.css';

const { Option } = Select;

interface Rendimento {
  id: string;
  lote_id: string;
  item_id: string;
  quantidade_entrada: number;
  quantidade_saida: number;
  percentual_rendimento: number;
  data_processamento: string;
  usuario_id: string;
  created_at: string;
  item_nome?: string;
  lote_codigo?: string;
}

const Rendimento: React.FC = () => {
  const [rendimentos, setRendimentos] = useState<Rendimento[]>([]);
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
      // Carregar rendimentos (implementar backend)
      setRendimentos([]);
    } catch (error) {
      message.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const rendimentoData = {
        ...values,
        percentual_rendimento: ((values.quantidade_saida / values.quantidade_entrada) * 100).toFixed(2),
        data_processamento: new Date().toISOString(),
        usuario_id: 'usuario_atual',
      };

      // Implementar cadastro no backend
      message.success('Rendimento registrado com sucesso');
      setModalVisible(false);
      form.resetFields();
      carregarDados();
    } catch (error) {
      message.error('Erro ao registrar rendimento');
      console.error(error);
    }
  };

  const rendimentoMedio = rendimentos.length > 0
    ? rendimentos.reduce((sum, r) => sum + r.percentual_rendimento, 0) / rendimentos.length
    : 0;

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
      title: 'Qtd Entrada',
      dataIndex: 'quantidade_entrada',
      key: 'quantidade_entrada',
      width: 120,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Qtd Saída',
      dataIndex: 'quantidade_saida',
      key: 'quantidade_saida',
      width: 120,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Rendimento',
      dataIndex: 'percentual_rendimento',
      key: 'percentual_rendimento',
      width: 120,
      render: (value: number) => {
        let color = 'green';
        if (value < 70) color = 'red';
        else if (value < 85) color = 'orange';
        
        return <Tag color={color}>{value.toFixed(2)}%</Tag>;
      },
    },
    {
      title: 'Data',
      dataIndex: 'data_processamento',
      key: 'data_processamento',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString('pt-BR'),
    },
  ];

  return (
    <div className="rendimento-page">
      <h1 style={{ marginBottom: 24 }}>Controle de Rendimento</h1>

      {/* Estatísticas */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total de Processamentos"
              value={rendimentos.length}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Rendimento Médio"
              value={rendimentoMedio}
              suffix="%"
              precision={2}
              valueStyle={{ color: rendimentoMedio >= 85 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Eficiência"
              value={rendimentoMedio >= 85 ? 100 : rendimentoMedio >= 70 ? 75 : 50}
              suffix="%"
              valueStyle={{ color: rendimentoMedio >= 85 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Ações */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Registrar Rendimento
          </Button>
          <Button icon={<SearchOutlined />} onClick={carregarDados}>
            Atualizar
          </Button>
        </Space>
      </Card>

      {/* Tabela de Rendimentos */}
      <Card title="Histórico de Rendimentos">
        <Table
          columns={columns}
          dataSource={rendimentos}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* Modal de Registro */}
      <Modal
        title="Registrar Rendimento"
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
            name="item_id"
            label="Item"
            rules={[{ required: true, message: 'Por favor, selecione o item' }]}
          >
            <Select placeholder="Selecione o item processado...">
              {itens.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.nome}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="lote_id"
            label="Lote"
            rules={[{ required: true, message: 'Por favor, selecione o lote' }]}
          >
            <Select placeholder="Selecione o lote...">
              {lotes.map((lote) => (
                <Option key={lote.id} value={lote.id}>
                  {lote.codigo_lote} - {lote.item_nome}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantidade_entrada"
                label="Quantidade Entrada"
                rules={[{ required: true, message: 'Por favor, insira a quantidade de entrada' }]}
              >
                <InputNumber
                  min="0"
                  step="0.01"
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantidade_saida"
                label="Quantidade Saída"
                rules={[{ required: true, message: 'Por favor, insira a quantidade de saída' }]}
              >
                <InputNumber
                  min="0"
                  step="0.01"
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="form-actions">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit">
                Registrar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Rendimento;