import { Alert, Card } from 'antd';
import { AlertOutlined } from '@ant-design/icons';

const Rastreabilidade: React.FC = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Rastreabilidade de Lotes</h1>
      <Alert
        message="Módulo em desenvolvimento"
        description="Este módulo irá permitir rastrear lotes de origem até produto final, incluindo timeline de movimentações."
        type="info"
        showIcon
        icon={<AlertOutlined />}
        style={{ marginBottom: 24 }}
      />
      <Card>
        <p>Funcionalidades:</p>
        <ul>
          <li>Timeline completa do lote</li>
          <li>Rastreamento reverso (produto final → insumos)</li>
          <li>Histórico de movimentações</li>
          <li>Busca por código de lote ou QR Code</li>
        </ul>
      </Card>
    </div>
  );
};

export default Rastreabilidade;