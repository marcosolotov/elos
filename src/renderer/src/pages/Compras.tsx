import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Tag, Statistic, Row, Col } from 'antd';
import { PlusOutlined, ShoppingCartOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons';
const { Option } = Select;
const { TextArea } = Input;
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
  const [listaId, setListaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [itens, setItens] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    setLoading(true);
    try {
      const [itensData] = await Promise.all([
        window.electronAPI.listarItens(),
      ]);
      setItens(itensData || []);
      
      // Tentar obter lista aberta existente ou criar nova
      let lista = await window.electronAPI.obterListaCompraAberta();
      if (!lista) {
        lista = await window.electronAPI.criarListaCompra();
      }
      setListaId(lista.id);
      
      // Carregar itens da lista
      await carregarItensLista(lista.id);
    } catch (error) {
      message.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const carregarItensLista = async (id: string) => {
    try {
      const data = await window.electronAPI.listarItensListaCompra(id);
      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        item_id: item.item_id,
        item_nome: item.item_nome,
        quantidade_sugerida: item.quantidade_sugerida,
        estoque_atual: item.estoque_atual || 0,
        estoque_minimo: item.estoque_minimo || 0,
        motivo: item.incluido_manualmente ? 'Adicionado manualmente' : 'Estoque baixo',
        prioridade: item.estoque_atual <= 0 ? 'alta' as const : item.estoque_atual < item.estoque_minimo / 2 ? 'alta' as const : 'media' as const,
      }));
      setItensCompra(mapped);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao carregar itens da lista:', error);
    }
  };

  const carregarSugestoes = async () => {
    setLoading(true);
    try {
      const sugestoes = await window.electronAPI.listarSugestoesCompra();
      if (sugestoes && sugestoes.length > 0) {
        // Adicionar sugestões à lista atual
        for (const sug of sugestoes) {
          try {
            await window.electronAPI.adicionarItemListaCompra({
              lista_id: listaId,
              item_id: sug.item_id,
              quantidade_sugerida: sug.quantidade_sugerida,
              incluido_manualmente: false,
            });
          } catch (e: any) {
            // Ignorar se já está na lista
            if (!e.message?.includes('já está na lista')) {
              console.error('Erro ao adicionar sugestão:', e);
            }
          }
        }
        if (listaId) await carregarItensLista(listaId);
        message.success(`${sugestoes.length} itens com estoque baixo adicionados`);
      } else {
        message.info('Nenhum item com estoque baixo encontrado');
      }
    } catch (error) {
      message.error('Erro ao carregar sugestões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarItem = async (values: any) => {
    try {
      if (!listaId) {
        message.error('Nenhuma lista de compras ativa');
        return;
      }
      
      await window.electronAPI.adicionarItemListaCompra({
        lista_id: listaId,
        item_id: values.item_id,
        quantidade_sugerida: values.quantidade_sugerida,
        incluido_manualmente: true,
      });
      
      await carregarItensLista(listaId);
      message.success('Item adicionado à lista de compras');
      setModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.message || 'Erro ao adicionar item');
      console.error(error);
    }
  };

  const handleFinalizarLista = async () => {
    if (!listaId) return;
    try {
      await window.electronAPI.finalizarListaCompra(listaId);
      message.success('Lista de compras finalizada!');
      
      // Criar nova lista
      const novaLista = await window.electronAPI.criarListaCompra();
      setListaId(novaLista.id);
      setItensCompra([]);
      setHasUnsavedChanges(false);
    } catch (error) {
      message.error('Erro ao finalizar lista');
      console.error(error);
    }
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
            name="item_id"
            label="Item"
            rules={[{ required: true, message: 'Por favor, selecione o item' }]}
          >
            <Select 
              placeholder="Selecione o item..."
              showSearch
              filterOption={(input, option) => 
                (option?.children as any)?.toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {itens.map((item: any) => (
                <Option key={item.id} value={item.id}>
                  {item.nome} - Estoque: {item.saldo_total?.toFixed(2) || '0.00'} | Mínimo: {item.estoque_minimo?.toFixed(2)}
                </Option>
              ))}
            </Select>
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
            initialValue="media"
            rules={[{ required: true, message: 'Por favor, selecione a prioridade' }]}
          >
            <Select placeholder="Selecione a prioridade...">
              <Option value="alta">🔴 Alta - Urgente</Option>
              <Option value="media">🟡 Média - Importante</Option>
              <Option value="baixa">🔵 Baixa - Preventiva</Option>
            </Select>
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