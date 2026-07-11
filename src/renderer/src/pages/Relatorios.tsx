import { Alert, Card } from 'antd';
import { AlertOutlined } from '@ant-design/icons';

const Relatorios: React.FC = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Relatórios Gerenciais</h1>
      <Alert
        message="Módulo em desenvolvimento"
        description="Este módulo irá gerar relatórios de posição de estoque, indicadores de perda, rendimento e validade."
        type="info"
        showIcon
        icon={<AlertOutlined />}
        style={{ marginBottom: 24 }}
      />
      <Card>
        <p>Funcionalidades:</p>
        <ul>
          <li>Relatório de posição de estoque</li>
          <li>Indicadores de perdas e desperdício</li>
          <li>Relatório de rendimento</li>
          <li>Análise de validade</li>
          <li>Exportação em PDF e CSV</li>
          <li>Gráficos visuais</li>
        </ul>
      </Card>
    </div>
  );
};

export default Relatorios;