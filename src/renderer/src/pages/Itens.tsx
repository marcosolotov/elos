import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import './Itens.css';

const { Option } = Select;

interface Item {
  id: string;
  nome: string;
  descricao?: string;
  grupo_id?: string;
  categoria_id?: string;
  estoque_minimo: number;
  unidade_medida: string;
  porcao_padrao_g?: number;
  created_at: string;
  updated_at: string;
}

const Itens: React.FC = () => {
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    carregarItens();
  }, []);

  const carregarItens = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.listarItens();
      setItens(data || []);
    } catch (error) {
      message.error('Erro ao carregar itens');
      console.error(error);
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
      console.error(error);
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
      console.error(error);
    }
  };

  const filteredItens = itens.filter((item) =>
    item.nome.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      sorter: (a: Item, b: Item) => a.nome.localeCompare(b.nome),
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      ellipsis: true,
    },
    {
      title: 'Unidade',
      dataIndex: 'unidade_medida',
      key: 'unidade_medida',
      width: 100,
    },
    {
      title: 'Estoque Mínimo',
      dataIndex: 'estoque_minimo',
      key: 'estoque_minimo',
      width: 120,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 150,
      render: (_: any, record: Item) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Tem certeza que deseja excluir este item?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="itens-page">
      <div className="itens-header">
        <h1>Gerenciamento de Itens</h1>
        <Space>
          <Input
            placeholder="Buscar item..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Novo Item
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredItens}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingItem ? 'Editar Item' : 'Novo Item'}
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
            name="nome"
            label="Nome do Item"
            rules={[{ required: true, message: 'Por favor, insira o nome do item' }]}
          >
            <Input placeholder="Ex: Arroz, Feijão, Carne..." />
          </Form.Item>

          <Form.Item
            name="descricao"
            label="Descrição"
          >
            <Input.TextArea rows={3} placeholder="Descrição detalhada do item..." />
          </Form.Item>

          <Form.Item
            name="unidade_medida"
            label="Unidade de Medida"
            rules={[{ required: true, message: 'Por favor, selecione a unidade de medida' }]}
          >
            <Select placeholder="Selecione...">
              <Option value="kg">Quilograma (kg)</Option>
              <Option value="g">Grama (g)</Option>
              <Option value="L">Litro (L)</Option>
              <Option value="ml">Mililitro (ml)</Option>
              <Option value="un">Unidade (un)</Option>
              <Option value="cx">Caixa (cx)</Option>
              <Option value="pct">Pacote (pct)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="estoque_minimo"
            label="Estoque Mínimo"
            rules={[{ required: true, message: 'Por favor, insira o estoque mínimo' }]}
          >
            <Input type="number" step="0.01" min="0" />
          </Form.Item>

          <Form.Item
            name="porcao_padrao_g"
            label="Porção Padrão (gramas)"
          >
            <Input type="number" step="0.1" min="0" placeholder="Ex: 150 para 150g" />
          </Form.Item>

          <Form.Item className="form-actions">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Itens;