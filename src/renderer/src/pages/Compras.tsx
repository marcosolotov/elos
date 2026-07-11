import { Alert, Card } from 'antd';
import { AlertOutlined } from '@ant-design/icons';

const Compras: React.FC = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Lista de Compras</h1>
      <Alert
        message="Módulo em desenvolvimento"
        description="Este módulo irá gerar sugestões automáticas de compra baseadas em estoque mínimo e validade."
        type="info"
        showIcon
        icon={<AlertOutlined />}
        style={{ marginBottom: 24 }}
      />
      <Card>
        <p>Funcionalidades:</p>
        <ul>
          <li>Sugestão automática de compra</li>
          <li>Baseado em estoque mínimo configurado</li>
          <li>Considera validade próxima e baixo giro</li>
          <li>Inclusão manual de itens</li>
          <li>Edição de quantidades</li>
          <li>Finalização da lista de compras</li>
        </ul>
      </Card>
    </div>
  );
};

export default Compras;