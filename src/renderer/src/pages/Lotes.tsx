import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, DatePicker, Select, message, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BarcodeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface Lote {
  id: string;
  codigo_lote: string;
  item_nome: string;
  data_validade: string;
  saldo_atual: number;
  ativo: boolean;
}

const Lotes: React.FC = () => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    carregarLotes();
  }, []);

  const carregarLotes = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.listarLotes();
      setLotes(data);
    } catch (error) {
      message.error('Erro ao carregar lotes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      message.success('Lote cadastrado com sucesso');
      setModalVisible(false);
      form.resetFields();
      carregarLotes();
    } catch (error) {
      message.error('Erro ao cadastrar lote');
    }
  };

  const columns = [
    { title: 'Código', dataIndex: 'codigo_lote', key: 'codigo_lote' },
    { title: 'Item', dataIndex: 'item_nome', key: 'item_nome' },
    { title: 'Validade', dataIndex: 'data_validade', key: 'data_validade' },
    { title: 'Saldo', dataIndex: 'saldo_atual', key: 'saldo_atual' },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      render: (ativo: boolean) => (
        <Tag color={ativo ? 'green' : 'red'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: () => (
        <Space>
          <Button icon={<BarcodeOutlined />} />
          <Button icon={<EditOutlined />} />
          <Button icon={<DeleteOutlined />} danger />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>Lotes</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Novo Lote
        </Button>
      </div>

      <Card>
        <Table
          dataSource={lotes}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Novo Lote"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="codigo_lote" label="Código do Lote" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="item_id" label="Item" rules={[{ required: true }]}>
            <Select placeholder="Selecione um item">
              <Select.Option value="1">Item 1</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="data_validade" label="Data de Validade" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="quantidade_inicial" label="Quantidade Inicial" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <div className="form-actions">
            <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">
              Salvar
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Lotes;