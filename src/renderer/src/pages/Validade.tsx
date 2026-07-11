import { Card, Alert, List, Tag } from 'antd';
import { AlertOutlined } from '@ant-design/icons';

const Validade: React.FC = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Controle de Validade</h1>
      <Alert
        message="Módulo em desenvolvimento"
        description="Este módulo irá exibir alertas de validade e permitir o gerenciamento de datas de vencimento dos lotes."
        type="info"
        showIcon
        icon={<AlertOutlined />}
        style={{ marginBottom: 24 }}
      />
      <Card>
        <p>Funcionalidades:</p>
        <ul>
          <li>Dashboard de alertas de vencimento</li>
          <li>Configuração de dias de antecedência para alertas</li>
          <li>Lista de itens próximos ao vencimento</li>
          <li>Histórico de validades</li>
        </ul>
      </Card>
    </div>
  );
};

export default Validade;