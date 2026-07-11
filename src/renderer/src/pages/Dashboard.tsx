import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Alert, Table, Tag, Progress } from 'antd';
import {
  AlertOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carregar alertas de validade
      const alertasData = await window.electronAPI.obterAlertasValidade();
      setAlertas(alertasData || []);

      // Carregar itens
      const itensData = await window.electronAPI.listarItens();
      setItens(itensData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const itensVencidos = alertas.filter((a) => a.dias_para_vencer <= 0).length;
  const itensProximosVencimento = alertas.filter((a) => a.dias_para_vencer > 0 && a.dias_para_vencer <= 7).length;
  const totalItens = itens.length;
  const totalLotes = alertas.length;

  const columns = [
    {
      title: 'Item',
      dataIndex: 'item_nome',
      key: 'item_nome',
    },
    {
      title: 'Lote',
      dataIndex: 'codigo_lote',
      key: 'codigo_lote',
    },
    {
      title: 'Validade',
      dataIndex: 'data_validade',
      key: 'data_validade',
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Dias Restantes',
      dataIndex: 'dias_para_vencer',
      key: 'dias_para_vencer',
      render: (dias: number) => {
        let color = 'green';
        if (dias <= 0) color = 'red';
        else if (dias <= 7) color = 'red';
        else if (dias <= 15) color = 'orange';
        else if (dias <= 30) color = 'yellow';

        return (
          <Tag color={color}>
            {dias <= 0 ? 'VENCIDO' : `${dias} dias`}
          </Tag>
        );
      },
    },
    {
      title: 'Saldo',
      dataIndex: 'saldo_atual',
      key: 'saldo_atual',
      render: (saldo: number) => saldo.toFixed(2),
    },
  ];

  return (
    <div className="dashboard">
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      {/* Estatísticas */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total de Itens"
              value={totalItens}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Lotes Ativos"
              value={totalLotes}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Vencidos"
              value={itensVencidos}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Próximos do Vencimento (7 dias)"
              value={itensProximosVencimento}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alertas de Validade */}
      <Card title="Alertas de Validade" style={{ marginBottom: 24 }}>
        {alertas.length === 0 ? (
          <Alert message="Nenhum alerta de validade no momento" type="success" showIcon />
        ) : (
          <Table
            columns={columns}
            dataSource={alertas}
            rowKey="lote_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        )}
      </Card>

      {/* Ações Rápidas */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Ações Rápidas" size="small">
            <p>• Cadastrar novo item</p>
            <p>• Registrar entrada de estoque</p>
            <p>• Gerar etiqueta QR Code</p>
            <p>• Realizar inventário</p>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Resumo do Sistema" size="small">
            <p>• Banco de dados: SQLite local</p>
            <p>• Modo: 100% offline</p>
            <p>• Versão: 1.0.0</p>
            <p>• Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;