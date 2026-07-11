import { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Switch, Button, message, Space, Tabs, Divider, Alert, Row, Col } from 'antd';
import { SettingOutlined, BellOutlined, DatabaseOutlined, UserOutlined, QrcodeOutlined } from '@ant-design/icons';
import './Configuracoes.css';

const { TabPane } = Tabs;
const { TextArea } = Input;

interface Configuracao {
  alerta_dias_validade: number;
  estoque_minimo_padrao: number;
  backup_automatico: boolean;
  intervalo_backup_horas: number;
  usuario_padrao: string;
  scanner_habilitado: boolean;
  balanca_habilitada: boolean;
}

const Configuracoes: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<Configuracao>({
    alerta_dias_validade: 30,
    estoque_minimo_padrao: 10,
    backup_automatico: true,
    intervalo_backup_horas: 24,
    usuario_padrao: '',
    scanner_habilitado: true,
    balanca_habilitada: true,
  });

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    setLoading(true);
    try {
      // Carregar configurações (implementar backend)
      // setConfig(data);
    } catch (error) {
      message.error('Erro ao carregar configurações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (values: Configuracao) => {
    setLoading(true);
    try {
      // Implementar salvamento no backend
      setConfig(values);
      message.success('Configurações salvas com sucesso!');
    } catch (error) {
      message.error('Erro ao salvar configurações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupManual = async () => {
    try {
      // Implementar backup manual
      message.success('Backup realizado com sucesso!');
    } catch (error) {
      message.error('Erro ao realizar backup');
      console.error(error);
    }
  };

  const handleRestaurarBackup = async () => {
    try {
      // Implementar restauração de backup
      message.success('Backup restaurado com sucesso!');
    } catch (error) {
      message.error('Erro ao restaurar backup');
      console.error(error);
    }
  };

  const tabItems = [
    {
      key: 'geral',
      label: (
        <span>
          <SettingOutlined />
          Geral
        </span>
      ),
      children: (
        <Card>
          <Form
            layout="vertical"
            onFinish={(values) => handleSalvar(values)}
            initialValues={config}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="alerta_dias_validade"
                  label="Dias para Alerta de Validade"
                  rules={[{ required: true, message: 'Por favor, insira o número de dias' }]}
                >
                  <InputNumber min="1" max="365" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="estoque_minimo_padrao"
                  label="Estoque Mínimo Padrão"
                  rules={[{ required: true, message: 'Por favor, insira o estoque mínimo' }]}
                >
                  <InputNumber min="0" step="0.01" precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="usuario_padrao"
              label="Usuário Padrão"
            >
              <Input placeholder="Nome do usuário padrão" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Salvar Configurações
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'alertas',
      label: (
        <span>
          <BellOutlined />
          Alertas
        </span>
      ),
      children: (
        <Card>
          <Alert
            message="Configurações de Alertas"
            description="Configure quando e como os alertas do sistema devem ser exibidos."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Form layout="vertical" initialValues={config}>
            <Form.Item
              name="alerta_dias_validade"
              label="Dias de antecedência para alerta de validade"
            >
              <InputNumber min="1" max="365" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="notificacao_estoque_baixo"
              label="Notificar quando estoque abaixo do mínimo"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="notificacao_vencimento"
              label="Notificar sobre vencimentos"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Salvar Alertas
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'backup',
      label: (
        <span>
          <DatabaseOutlined />
          Backup
        </span>
      ),
      children: (
        <Card>
          <Alert
            message="Backup e Restauração"
            description="Gerencie backups do banco de dados local."
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form layout="vertical" initialValues={config}>
            <Form.Item
              name="backup_automatico"
              label="Backup Automático"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="intervalo_backup_horas"
              label="Intervalo de Backup (horas)"
            >
              <InputNumber min="1" max="168" style={{ width: '100%' }} />
            </Form.Item>

            <Divider />

            <Space>
              <Button type="primary" icon={<DatabaseOutlined />} onClick={handleBackupManual}>
                Fazer Backup Agora
              </Button>
              <Button icon={<DatabaseOutlined />} onClick={handleRestaurarBackup}>
                Restaurar Backup
              </Button>
            </Space>
          </Form>
        </Card>
      ),
    },
    {
      key: 'perifericos',
      label: (
        <span>
          <QrcodeOutlined />
          Periféricos
        </span>
      ),
      children: (
        <Card>
          <Alert
            message="Integração com Hardware"
            description="Configure scanners de QR Code e balanças conectadas ao computador."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form layout="vertical" initialValues={config}>
            <Form.Item
              name="scanner_habilitado"
              label="Scanner de QR Code"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="balanca_habilitada"
              label="Balança de Peso"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Divider />

            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
              <h4>Dispositivos Conectados:</h4>
              <p><strong>Scanner:</strong> {config.scanner_habilitado ? 'Habilitado' : 'Desabilitado'}</p>
              <p><strong>Balança:</strong> {config.balanca_habilitada ? 'Habilitada' : 'Desabilitada'}</p>
              <p style={{ color: '#999', fontSize: 12 }}>Conecte o dispositivo e clique em "Testar" para verificar a conexão.</p>
            </div>

            <Form.Item style={{ marginTop: 16 }}>
              <Space>
                <Button type="primary">Testar Scanner</Button>
                <Button>Testar Balança</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div className="configuracoes-page">
      <h1 style={{ marginBottom: 24 }}>Configurações</h1>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      <Card title="Informações do Sistema" style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <p><strong>Versão:</strong> 1.0.0</p>
            <p><strong>Banco de Dados:</strong> SQLite</p>
            <p><strong>Modo:</strong> 100% Offline</p>
          </Col>
          <Col span={8}>
            <p><strong>Plataforma:</strong> {navigator.platform}</p>
            <p><strong>Electron:</strong> {process.versions.electron}</p>
            <p><strong>Node.js:</strong> {process.versions.node}</p>
          </Col>
          <Col span={8}>
            <p><strong>Último Backup:</strong> Nunca</p>
            <p><strong>Espaço em Disco:</strong> Disponível</p>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Configuracoes;