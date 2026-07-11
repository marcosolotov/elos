import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface Item {
  id: string;
  nome: string;
  descricao?: string;
  unidade_medida: string;
  estoque_minimo: number;
}

const Itens: React.FC = () => {
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    carregarItens();
  }, []);

  const carregarItens = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.listarItens();
      setItens(data);
    } catch (error) {
      message.error('Erro ao carregar itens');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Item) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await window.electronAPI.excluirItem(id);
      message.success('Item excluído com sucesso');
      carregarItens();
    } catch (error) {
      message.error('Erro ao excluir item');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        await window.electronAPI.atualizarItem(editingItem.id, values);
        message.success('Item atualizado com sucesso');
      } else {
        await window.electronAPI.cadastrarItem(values);
        message.success('Item cadastrado com sucesso');
      }
      setModalVisible(false);
      carregarItens();
    } catch (error) {
      message.error('Erro ao salvar item');
    }
  };

  const columns = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao' },
    { title: 'Unidade', dataIndex: 'unidade_medida', key: 'unidade_medida' },
    { title: 'Estoque Mínimo', dataIndex: 'estoque_minimo', key: 'estoque_minimo' },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_: any, record: Item) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>Itens</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Novo Item
        </Button>
      </div>

      <Card>
        <Table
          dataSource={itens}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingItem ? 'Editar Item' : 'Novo Item'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="descricao" label="Descrição">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="unidade_medida" label="Unidade de Medida" rules={[{ required: true }]}>
            <Select placeholder="Selecione">
              <Select.Option value="kg">Quilograma (kg)</Select.Option>
              <Select.Option value="g">Grama (g)</Select.Option>
              <Select.Option value="L">Litro (L)</Select.Option>
              <Select.Option value="ml">Mililitro (ml)</Select.Option>
              <Select.Option value="un">Unidade (un)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="estoque_minimo" label="Estoque Mínimo" rules={[{ required: true }]}>
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

export default Itens;