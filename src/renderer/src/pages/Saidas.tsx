import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined, MinusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './Saidas.css';

const { Option } = Select;
const { TextArea } = Input;

interface Saida {
  id: string;
  lote_id: string;
  quantidade: number;
  data: string;
  usuario_id: string;
  motivo?: string;
  documento_referencia?: string;
  created_at: string;
  item_nome?: string;
  lote_codigo?: string;
}

const Saidas: React.FC = () => {
  const [saidas, setSaidas] = useState<Saida[]>([]);
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
      const [lotesData, saidasData] = await Promise.all([
        window.electronAPI.listarLotes(),
        window.electronAPI.listarSaidas(),
      ]);
      setLotes(lotesData || []);
      setSaidas(saidasData || []);
    } catch (error) {
      message.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      await window.electronAPI.registrarSaida({
        lote_id: values.lote_id,
        quantidade: values.quantidade,
        tipo: 'saida',
        usuario_id: 'admin',
        motivo: values.motivo,
        documento_referencia: values.documento_referencia,
      });
      message.success('Saída registrada com sucesso');
      setModalVisible(false);
      form.resetFields();
      carregarDados();
    } catch (error) {
      message.error('Erro ao registrar saída');
      console.error(error);
    }
  };

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
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString('pt-BR'),
    },
    {
      title: 'Motivo',
      dataIndex: 'motivo',
      key: 'motivo',
      ellipsis: true,
    },
  ];

  return (
    <div className="saidas-page">
      <h1 style={{ marginBottom: 24 }}>Saída de Produtos</h1>

      {/* Ações */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Registrar Saída
          </Button>
          <Button icon={<SearchOutlined />} onClick={carregarDados}>
            Atualizar
          </Button>
        </Space>
      </Card>

      {/* Tabela de Saídas */}
      <Card title="Histórico de Saídas">
        <Table
          columns={columns}
          dataSource={saidas}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* Modal de Registro */}
      <Modal
        title="Registrar Saída"
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
            name="data"
            label="Data da Saída"
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="motivo"
            label="Motivo da Saída"
            rules={[{ required: true, message: 'Por favor, insira o motivo' }]}
          >
            <Input placeholder="Ex: Uso no prato, venda, etc." />
          </Form.Item>

          <Form.Item
            name="documento_referencia"
            label="Documento de Referência"
          >
            <Input placeholder="Ex: NF-e, pedido, etc." />
          </Form.Item>

          <Form.Item className="form-actions">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit">
                Registrar Saída
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Saidas;