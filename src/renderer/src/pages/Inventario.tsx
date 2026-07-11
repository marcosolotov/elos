import { Alert, Card } from 'antd';
import { AlertOutlined } from '@ant-design/icons';

const Inventario: React.FC = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Inventário</h1>
      <Alert
        message="Módulo em desenvolvimento"
        description="Este módulo irá permitir realizar inventários periódicos com detecção de divergências entre estoque físico e sistema."
        type="info"
        showIcon
        icon={<AlertOutlined />}
        style={{ marginBottom: 24 }}
      />
      <Card>
        <p>Funcionalidades:</p>
        <ul>
          <li>Abertura de contagem de inventário</li>
          <li>Geração de lista de contagem</li>
          <li>Registro de quantidade contada</li>
          <li>Detecção de divergências</li>
          <li>Ajuste de saldo com motivo</li>
        </ul>
      </Card>
    </div>
  );
};

export default Inventario;