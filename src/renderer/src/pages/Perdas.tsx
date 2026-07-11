import { Alert, Card } from 'antd';
import { AlertOutlined } from '@ant-design/icons';

const Perdas: React.FC = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Controle de Perdas e Desperdício</h1>
      <Alert
        message="Módulo em desenvolvimento"
        description="Este módulo irá registrar e controlar perdas e desperdícios, com relatórios consolidados por período."
        type="info"
        showIcon
        icon={<AlertOutlined />}
        style={{ marginBottom: 24 }}
      />
      <Card>
        <p>Funcionalidades:</p>
        <ul>
          <li>Registro de perdas por item/lote</li>
          <li>Motivo da perda (vencimento, quebra, descarte)</li>
          <li>Relatório consolidado de perdas</li>
          <li>Análise por período e categoria</li>
          <li>Identificação de maiores desperdícios</li>
        </ul>
      </Card>
    </div>
  );
};

export default Perdas;