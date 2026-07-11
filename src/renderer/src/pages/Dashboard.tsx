import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Alert, List, Tag } from 'antd';
import {
  ShoppingOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';

interface DashboardData {
  totalItens: number;
  totalLotes: number;
  alertasValidade: any[];
  estoqueBaixo: any[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    totalItens: 0,
    totalLotes: 0,
    alertasValidade: [],
    estoqueBaixo: [],
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [itens, lotes, alertas] = await Promise.all([
        window.electronAPI.listarItens(),
        window.electronAPI.listarLotes(),
        window.electronAPI.obterAlertasValidade(),
      ]);

      setData({
        totalItens: itens.length,
        totalLotes: lotes.length,
        alertasValidade: alertas.slice(0, 5),
        estoqueBaixo: [],
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'critica':
        return 'red';
      case 'alta':
        return 'orange';
      case 'media':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total de Itens"
              value={data.totalItens}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1a3a5c' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total de Lotes"
              value={data.totalLotes}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Alertas de Validade"
              value={data.alertasValidade.length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Estoque Baixo"
              value={data.estoqueBaixo.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {data.alertasValidade.length > 0 && (
        <Card title="Alertas de Validade" style={{ marginBottom: 24 }}>
          <List
            itemLayout="horizontal"
            dataSource={data.alertasValidade}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <span>
                      {item.item_nome} - Lote: {item.codigo_lote}
                      <Tag color={getUrgenciaColor(item.urgencia)} style={{ marginLeft: 8 }}>
                        {item.urgencia.toUpperCase()}
                      </Tag>
                    </span>
                  }
                  description={
                    <span>
                      Vencimento: {new Date(item.data_validade).toLocaleDateString('pt-BR')} -{' '}
                      {item.dias_para_vencer <= 0
                        ? `Vencido há ${Math.abs(item.dias_para_vencer)} dias`
                        : `Vence em ${item.dias_para_vencer} dias`}{' '}
                      - Saldo: {item.saldo_atual}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {data.alertasValidade.length === 0 && (
        <Alert
          message="Nenhum alerta de validade no momento"
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
    </div>
  );
};

export default Dashboard;