import { Alert, Card } from 'antd';
import { AlertOutlined } from '@ant-design/icons';

const Rendimento: React.FC = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Controle de Rendimento</h1>
      <Alert
        message="Módulo em desenvolvimento"
        description="Este módulo irá controlar o rendimento de insumos transformados em produção e o porcionamento padrão."
        type="info"
        showIcon
        icon={<AlertOutlined />}
        style={{ marginBottom: 24 }}
      />
      <Card>
        <p>Funcionalidades:</p>
        <ul>
          <li>Registro de rendimento de processamento</li>
          <li>Cálculo automático de percentual de rendimento</li>
          <li>Definição de porção padrão por item</li>
          <li>Conversão automática de unidades</li>
          <li>Histórico de rendimentos</li>
        </ul>
      </Card>
    </div>
  );
};

export default Rendimento;