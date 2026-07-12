import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, DatePicker, Select, message, Space, Tag, Popconfirm, InputNumber, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, QrcodeOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './Lotes.css';

const { Option } = Select;
const { TextArea } = Input;

interface Lote {
  id: string;
  item_id: string;
  codigo_lote: string;
  data_fabricacao?: string;
  data_validade: string;
  quantidade_inicial: number;
  saldo_atual: number;
  fornecedor_id?: string;
  data_entrada: string;
  ativo: boolean;
  created_at: string;
  item_nome?: string;
}

const Lotes: React.FC = () => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [lotesData, itensData] = await Promise.all([
        window.electronAPI.listarLotes(),
        window.electronAPI.listarItens(),
      ]);
      setLotes(lotesData || []);
      setItens(itensData || []);
    } catch (error) {
      message.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLote(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Lote) => {
    setEditingLote(record);
    const formattedRecord = {
      ...record,
      data_fabricacao: record.data_fabricacao ? dayjs(record.data_fabricacao) : undefined,
      data_validade: record.data_validade ? dayjs(record.data_validade) : undefined,
    };
    form.setFieldsValue(formattedRecord);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await window.electronAPI.excluirLote(id);
      message.success('Lote excluído com sucesso');
      carregarDados();
    } catch (error) {
      message.error('Erro ao excluir lote');
      console.error(error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const loteData = {
        ...values,
        data_fabricacao: values.data_fabricacao ? dayjs(values.data_fabricacao).toISOString() : null,
        data_validade: values.data_validade ? dayjs(values.data_validade).toISOString() : new Date().toISOString(),
        quantidade_inicial: parseFloat(values.quantidade_inicial) || 0,
        saldo_atual: parseFloat(values.quantidade_inicial) || 0,
        ativo: true,
        data_entrada: editingLote ? editingLote.data_entrada : new Date().toISOString(),
      };

      if (editingLote) {
        await window.electronAPI.atualizarLote(editingLote.id, loteData);
        message.success('Lote atualizado com sucesso');
      } else {
        await window.electronAPI.cadastrarLote(loteData);
        message.success('Lote cadastrado com sucesso');
      }
      setModalVisible(false);
      carregarDados();
    } catch (error) {
      message.error('Erro ao salvar lote');
      console.error(error);
    }
  };

  const handleImprimirEtiqueta = async (lote: Lote) => {
    try {
      // Primeiro gera o QR Code
      const qrCodeDataUrl = await window.electronAPI.gerarQRCode({
        loteId: lote.id,
        codigoLote: lote.codigo_lote,
        itemNome: lote.item_nome || 'Item',
      });

      // Depois imprime a etiqueta
      await window.electronAPI.imprimirEtiqueta({
        codigoLote: lote.codigo_lote,
        itemNome: lote.item_nome || 'Item',
        dataValidade: lote.data_validade,
        dataFabricacao: lote.data_fabricacao,
        saldoAtual: lote.saldo_atual,
        qrCodeDataUrl,
      });

      message.success('Etiqueta enviada para impressão');
    } catch (error) {
      message.error('Erro ao imprimir etiqueta');
      console.error(error);
    }
  };

  const handleGerarQRCode = async (lote: Lote) => {
    try {
      const qrCode = await window.electronAPI.gerarQRCode({
        loteId: lote.id,
        codigoLote: lote.codigo_lote,
        itemNome: lote.item_nome || 'Item',
      });
      
      // Abrir modal com QR Code
      Modal.info({
        title: 'QR Code do Lote',
        content: (
          <div style={{ textAlign: 'center' }}>
            <img src={qrCode} alt="QR Code" style={{ maxWidth: '100%', marginBottom: 16 }} />
            <p><strong>Lote:</strong> {lote.codigo_lote}</p>
            <p><strong>Item:</strong> {lote.item_nome}</p>
            <p><strong>Validade:</strong> {new Date(lote.data_validade).toLocaleDateString('pt-BR')}</p>
          </div>
        ),
        width: 400,
      });
    } catch (error) {
      message.error('Erro ao gerar QR Code');
      console.error(error);
    }
  };

  const filteredLotes = lotes.filter((lote) =>
    lote.codigo_lote.toLowerCase().includes(searchText.toLowerCase()) ||
    lote.item_nome?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Código do Lote',
      dataIndex: 'codigo_lote',
      key: 'codigo_lote',
      width: 150,
    },
    {
      title: 'Item',
      dataIndex: 'item_nome',
      key: 'item_nome',
      ellipsis: true,
    },
    {
      title: 'Data Validade',
      dataIndex: 'data_validade',
      key: 'data_validade',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
      sorter: (a: Lote, b: Lote) => new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime(),
    },
    {
      title: 'Qtd Inicial',
      dataIndex: 'quantidade_inicial',
      key: 'quantidade_inicial',
      width: 100,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Saldo Atual',
      dataIndex: 'saldo_atual',
      key: 'saldo_atual',
      width: 120,
      render: (value: number) => {
        let color = 'green';
        if (value === 0) color = 'red';
        else if (value < 10) color = 'orange';
        
        return <Tag color={color}>{value.toFixed(2)}</Tag>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: any, record: Lote) => {
        const diasRestantes = Math.floor(
          (new Date(record.data_validade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diasRestantes <= 0) return <Tag color="red">Vencido</Tag>;
        if (diasRestantes <= 7) return <Tag color="red">Crítico</Tag>;
        if (diasRestantes <= 15) return <Tag color="orange">Atenção</Tag>;
        return <Tag color="green">OK</Tag>;
      },
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 200,
      render: (_: any, record: Lote) => (
        <Space size="small">
            <Button
            type="primary"
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => handleImprimirEtiqueta(record)}
            title="Imprimir Etiqueta"
          />
          <Button
            type="primary"
            size="small"
            icon={<QrcodeOutlined />}
            onClick={() => handleGerarQRCode(record)}
            title="Gerar QR Code"
          />
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Tem certeza que deseja excluir este lote?"
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
    <div className="lotes-page">
      <div className="lotes-header">
        <h1>Gerenciamento de Lotes</h1>
        <Space>
          <Input
            placeholder="Buscar lote ou item..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Novo Lote
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredLotes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingLote ? 'Editar Lote' : 'Novo Lote'}
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
            <Select placeholder="Selecione o item...">
              {itens.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.nome}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="codigo_lote"
            label="Código do Lote"
            rules={[{ required: true, message: 'Por favor, insira o código do lote' }]}
          >
            <Input placeholder="Ex: LOTE-2024-001" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="data_fabricacao"
                label="Data de Fabricação"
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="data_validade"
                label="Data de Validade"
                rules={[{ required: true, message: 'Por favor, selecione a data de validade' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quantidade_inicial"
            label="Quantidade Inicial"
            rules={[{ required: true, message: 'Por favor, insira a quantidade inicial' }]}
          >
            <InputNumber
              min="0"
              step="0.01"
              precision={2}
              style={{ width: '100%' }}
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item className="form-actions">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit">
                {editingLote ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Lotes;