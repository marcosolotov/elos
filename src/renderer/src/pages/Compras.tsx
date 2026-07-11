import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, message, Space, Tag, Statistic, Row, Col } from 'antd';
import { PlusOutlined, ShoppingCartOutlined, CheckOutlined } from '@ant-design/icons';
import './Compras.css';

interface ItemCompra {
  id: string;
  item_id: string;
  item_nome: string;
  quantidade_sugerida: number;
  estoque_atual: number;
  estoque_minimo: number;
  motivo: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

const Compras: React.FC = () => {
  const [itensCompra, setItensCompra] = useState<ItemCompra[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    carregarSugestoes();
  }, []);

  const carregarSugestoes = async () => {
    setLoading(true);
    try {
      // Carregar itens com estoque baixo (implementar backend)
      setItensCompra([]);
    } catch (error) {
      message.error('Erro ao carregar sugestões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarItem = async (values: any) => {
    try {
      // Implementar cadastro no backend
      message.success('Item adicionado à lista de compras');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Erro ao adicionar item');
      console.error(error);
    }
  };

  const handleFinalizarLista = () => {
    message.success('Lista de compras finalizada!');
    // Implementar exportação ou impressão
  };

  const totalItens = itensCompra.length;
  const valorTotalEstimado = itensCompra.reduce((sum, item) => sum + (item.quantidade_sugerida * 10), 0); // Valor fictício

  const columns = [
    {
      title: 'Item',
      dataIndex: 'item_nome',
      key: 'item_nome',
      ellipsis: true,
    },
    {
      title: 'Estoque Atual',
      dataIndex: 'estoque_atual',
      key: 'estoque_atual',
      width: 120,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Estoque Mínimo',
      dataIndex: 'estoque_minimo',
      key: 'estoque_minimo',
      width: 120,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Qtd Sugerida',
      dataIndex: 'quantidade_sugerida',
      key: 'quantidade_sugerida',
      width: 120,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Motivo',
      dataIndex: 'motivo',
      key: 'motivo',
      ellipsis: true,
    },
    {
      title: 'Prioridade',
      dataIndex: 'prioridade',
      key: 'prioridade',
      width: 100,
      render: (prioridade: string) => {
        const cores: Record<string, string> = {
          alta: 'red',
          media: 'orange',
          baixa: 'blue',
        };
        return <Tag color={cores[prioridade]}>{prioridade.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div className="compras-page">
      <h1 style={{ marginBottom: 24 }}>Lista de Compras</h1>

      {/* Estatísticas */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Itens para Comprar"
              value={totalItens}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Valor Total Estimado"
              value={valorTotalEstimado}
              prefix="R$"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Itens Críticos"
              value={itensCompra.filter(i => i.prioridade === 'alta').length}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Ações */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Adicionar Item Manualmente
          </Button>
          <Button icon={<ShoppingCartOutlined />} onClick={carregarSugestoes}>
            Atualizar Sugestões
          </Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={handleFinalizarLista}>
            Finalizar Lista
          </Button>
        </Space>
      </Card>

      {/* Lista de Compras */}
      <Card title="Itens para Compra">
        {itensCompra.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Nenhum item na lista de compras no momento</p>
            <p style={{ color: '#999', fontSize: 14 }}>
              Itens com estoque abaixo do mínimo aparecerão aqui automaticamente
            </p>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={itensCompra}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        )}
      </Card>

      {/* Modal de Adição Manual */}
      <Modal
        title="Adicionar Item à Lista de Compras"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAdicionarItem}
        >
          <Form.Item
            name="item_nome"
            label="Nome do Item"
            rules={[{ required: true, message: 'Por favor, insira o nome do item' }]}
          >
            <Input placeholder="Ex: Arroz, Feijão..." />
          </Form.Item>

          <Form.Item
            name="quantidade_sugerida"
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
            label="Motivo da Compra"
            rules={[{ required: true, message: 'Por favor, insira o motivo' }]}
          >
            <Input.TextArea rows={3} placeholder="Ex: Estoque baixo, reposição preventiva..." />
          </Form.Item>

          <Form.Item
            name="prioridade"
            label="Prioridade"
            rules={[{ required: true, message: 'Por favor, selecione a prioridade' }]}
          >
            <select
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d9d9d9', width: '100%' }}
            >
              <option value="alta">Alta - Urgente</option>
              <option value="media">Média - Importante</option>
              <option value="baixa">Baixa - Preventiva</option>
            </select>
          </Form.Item>

          <Form.Item className="form-actions">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit">
                Adicionar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Compras;