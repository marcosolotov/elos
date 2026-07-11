import { useState, useEffect } from 'react';
import { Card, Table, Button, DatePicker, message, Space, Tag, Statistic, Row, Col, Select, Tabs } from 'antd';
import { FileTextOutlined, DownloadOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons';
import './Relatorios.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Relatorio {
  id: string;
  nome: string;
  tipo: string;
  data_geracao: string;
  periodo_inicio?: string;
  periodo_fim?: string;
}

const Relatorios: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState<any>(null);
  const [tipoRelatorio, setTipoRelatorio] = useState('estoque');

  const gerarRelatorio = async (tipo: string) => {
    setLoading(true);
    try {
      // Implementar geração de relatórios no backend
      message.success(`Relatório de ${tipo} gerado com sucesso!`);
      
      // Simular download
      setTimeout(() => {
        message.info('Download iniciado (simulação)');
      }, 1000);
    } catch (error) {
      message.error('Erro ao gerar relatório');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    message.success('Exportando dados para CSV...');
    // Implementar exportação CSV
  };

  const exportarPDF = () => {
    message.success('Gerando PDF...');
    // Implementar geração de PDF
  };

  const tabItems = [
    {
      key: 'estoque',
      label: (
        <span>
          <BarChartOutlined />
          Posição de Estoque
        </span>
      ),
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<DownloadOutlined />} onClick={() => gerarRelatorio('estoque')}>
              Gerar Relatório
            </Button>
            <Button icon={<FileTextOutlined />} onClick={exportarCSV}>
              Exportar CSV
            </Button>
            <Button icon={<FileTextOutlined />} onClick={exportarPDF}>
              Exportar PDF
            </Button>
          </Space>
          <p style={{ color: '#999' }}>Relatório com posição atual de todos os itens em estoque, incluindo lotes e validades.</p>
        </Card>
      ),
    },
    {
      key: 'perdas',
      label: (
        <span>
          <PieChartOutlined />
          Perdas e Desperdício
        </span>
      ),
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <RangePicker onChange={(dates) => setPeriodo(dates)} />
            <Button type="primary" icon={<DownloadOutlined />} onClick={() => gerarRelatorio('perdas')}>
              Gerar Relatório
            </Button>
          </Space>
          <p style={{ color: '#999' }}>Relatório de perdas por período, com análise por motivo e item.</p>
        </Card>
      ),
    },
    {
      key: 'rendimento',
      label: (
        <span>
          <BarChartOutlined />
          Rendimento
        </span>
      ),
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <RangePicker onChange={(dates) => setPeriodo(dates)} />
            <Button type="primary" icon={<DownloadOutlined />} onClick={() => gerarRelatorio('rendimento')}>
              Gerar Relatório
            </Button>
          </Space>
          <p style={{ color: '#999' }}>Relatório de rendimento de produção, com médias e eficiência por item.</p>
        </Card>
      ),
    },
    {
      key: 'validade',
      label: (
        <span>
          <PieChartOutlined />
          Validade
        </span>
      ),
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Select defaultValue="30" style={{ width: 150 }}>
              <Option value="7">Próximos 7 dias</Option>
              <Option value="15">Próximos 15 dias</Option>
              <Option value="30">Próximos 30 dias</Option>
              <Option value="90">Próximos 90 dias</Option>
            </Select>
            <Button type="primary" icon={<DownloadOutlined />} onClick={() => gerarRelatorio('validade')}>
              Gerar Relatório
            </Button>
          </Space>
          <p style={{ color: '#999' }}>Relatório de validade de lotes, com alertas e vencimentos.</p>
        </Card>
      ),
    },
  ];

  return (
    <div className="relatorios-page">
      <h1 style={{ marginBottom: 24 }}>Relatórios Gerenciais</h1>

      {/* Estatísticas Rápidas */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Relatórios Gerados"
              value={0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Exportações"
              value={0}
              prefix={<DownloadOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Último Relatório"
              value="-"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Formatos"
              value="PDF/CSV"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Relatórios Disponíveis */}
      <Card title="Relatórios Disponíveis">
        <Tabs items={tabItems} />
      </Card>

      {/* Histórico de Relatórios */}
      <Card title="Histórico de Relatórios" style={{ marginTop: 24 }}>
        <Table
          columns={[
            {
              title: 'Nome',
              dataIndex: 'nome',
              key: 'nome',
            },
            {
              title: 'Tipo',
              dataIndex: 'tipo',
              key: 'tipo',
              width: 150,
            },
            {
              title: 'Período',
              key: 'periodo',
              width: 250,
              render: (_: any, record: any) => {
                if (record.periodo_inicio && record.periodo_fim) {
                  return `${new Date(record.periodo_inicio).toLocaleDateString('pt-BR')} - ${new Date(record.periodo_fim).toLocaleDateString('pt-BR')}`;
                }
                return '-';
              },
            },
            {
              title: 'Data Geração',
              dataIndex: 'data_geracao',
              key: 'data_geracao',
              width: 180,
              render: (date: string) => new Date(date).toLocaleString('pt-BR'),
            },
            {
              title: 'Ações',
              key: 'acoes',
              width: 150,
              render: () => (
                <Space size="small">
                  <Button type="primary" size="small" icon={<DownloadOutlined />}>
                    Download
                  </Button>
                </Space>
              ),
            },
          ]}
          dataSource={[]}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Relatorios;