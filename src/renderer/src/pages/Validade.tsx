import { useState, useEffect } from 'react';
import { Card, Table, Tag, Alert, Statistic, Row, Col, Progress, DatePicker } from 'antd';
import { ClockCircleOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './Validade.css';

const Validade: React.FC = () => {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroDias, setFiltroDias] = useState(30);

  useEffect(() => {
    carregarAlertas();
  }, [filtroDias]);

  const carregarAlertas = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.obterAlertasValidade();
      setAlertas(data || []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const vencidos = alertas.filter((a) => a.dias_para_vencer <= 0);
  const criticos = alertas.filter((a) => a.dias_para_vencer > 0 && a.dias_para_vencer <= 7);
  const atencao = alertas.filter((a) => a.dias_para_vencer > 7 && a.dias_para_vencer <= 15);
  const ok = alertas.filter((a) => a.dias_para_vencer > 15);

  const columns = [
    {
      title: 'Item',
      dataIndex: 'item_nome',
      key: 'item_nome',
      ellipsis: true,
    },
    {
      title: 'Lote',
      dataIndex: 'codigo_lote',
      key: 'codigo_lote',
      width: 150,
    },
    {
      title: 'Data Validade',
      dataIndex: 'data_validade',
      key: 'data_validade',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
      sorter: (a: any, b: any) => new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime(),
    },
    {
      title: 'Dias Restantes',
      dataIndex: 'dias_para_vencer',
      key: 'dias_para_vencer',
      width: 120,
      sorter: (a: any, b: any) => a.dias_para_vencer - b.dias_para_vencer,
      render: (dias: number) => {
        let color = 'green';
        let texto = `${dias} dias`;
        
        if (dias <= 0) {
          color = 'red';
          texto = 'VENCIDO';
        } else if (dias <= 7) {
          color = 'red';
        } else if (dias <= 15) {
          color = 'orange';
        } else if (dias <= 30) {
          color = 'yellow';
        }

        return <Tag color={color}>{texto}</Tag>;
      },
    },
    {
      title: 'Saldo',
      dataIndex: 'saldo_atual',
      key: 'saldo_atual',
      width: 100,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Urgência',
      key: 'urgencia',
      width: 120,
      render: (dias: number) => {
        if (dias <= 0) return <Tag color="red">Crítica</Tag>;
        if (dias <= 7) return <Tag color="red">Alta</Tag>;
        if (dias <= 15) return <Tag color="orange">Média</Tag>;
        return <Tag color="blue">Baixa</Tag>;
      },
    },
  ];

  return (
    <div className="validade-page">
      <h1 style={{ marginBottom: 24 }}>Controle de Validade</h1>

      {/* Filtros */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: 8 }}>Alertas de validade:</span>
            <DatePicker.RangePicker
              value={[null, null]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  const diff = dates[1].toDate().getTime() - dates[0].toDate().getTime();
                  setFiltroDias(Math.ceil(diff / (1000 * 60 * 60 * 24)));
                }
              }}
              placeholder={['Data inicial', 'Data final']}
            />
          </Col>
          <Col>
            <span>ou</span>
          </Col>
          <Col>
            <select
              value={filtroDias}
              onChange={(e) => setFiltroDias(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}
            >
              <option value={7}>Próximos 7 dias</option>
              <option value={15}>Próximos 15 dias</option>
              <option value={30}>Próximos 30 dias</option>
              <option value={60}>Próximos 60 dias</option>
              <option value={90}>Próximos 90 dias</option>
            </select>
          </Col>
        </Row>
      </Card>

      {/* Estatísticas */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Vencidos"
              value={vencidos.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Críticos (≤7 dias)"
              value={criticos.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Atenção (8-15 dias)"
              value={atencao.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="OK (>15 dias)"
              value={ok.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alertas */}
      <Card title={`Alertas de Validade (${alertas.length})`}>
        {alertas.length === 0 ? (
          <Alert
            message="Nenhum alerta de validade no período"
            type="success"
            showIcon
            description="Todos os lotes estão com validade em dia!"
          />
        ) : (
          <Table
            columns={columns}
            dataSource={alertas}
            rowKey="lote_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
            size="small"
          />
        )}
      </Card>

      {/* Resumo Visual */}
      {alertas.length > 0 && (
        <Card title="Distribuição de Validade" style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Progress
                type="circle"
                percent={Math.round((vencidos.length / alertas.length) * 100)}
                status="exception"
                format={() => `${vencidos.length} vencidos`}
              />
            </Col>
            <Col span={12}>
              <Progress
                type="circle"
                percent={Math.round((criticos.length / alertas.length) * 100)}
                status="exception"
                format={() => `${criticos.length} críticos`}
              />
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default Validade;