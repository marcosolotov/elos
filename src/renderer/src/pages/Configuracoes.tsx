import { Alert, Card } from 'antd';
import { AlertOutlined } from '@ant-design/icons';

const Configuracoes: React.FC = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Configurações</h1>
      <Alert
        message="Módulo em desenvolvimento"
        description="Este módulo irá permitir configurar parâmetros do sistema, backup, integração com periféricos e preferências."
        type="info"
        showIcon
        icon={<AlertOutlined />}
        style={{ marginBottom: 24 }}
      />
      <Card>
        <p>Funcionalidades:</p>
        <ul>
          <li>Configuração de alertas de validade</li>
          <li>Parâmetros de estoque mínimo</li>
          <li>Integração com scanner e balança</li>
          <li>Configuração de backup automático</li>
          <li>Gerenciamento de usuários</li>
          <li>Preferências de interface</li>
        </ul>
      </Card>
    </div>
  );
};

export default Configuracoes;