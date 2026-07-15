import { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Switch, Button, message, Space, Tabs, Divider, Alert, Row, Col, Table, Tag, DatePicker, Popconfirm, Modal, List, Typography, Tooltip } from 'antd';
import { SettingOutlined, BellOutlined, DatabaseOutlined, QrcodeOutlined, FileTextOutlined, DownloadOutlined, DeleteOutlined, SearchOutlined, GoogleOutlined, CloudUploadOutlined, CloudDownloadOutlined, CloudSyncOutlined, LinkOutlined, DisconnectOutlined } from '@ant-design/icons';
import './Configuracoes.css';

const { RangePicker } = DatePicker;

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

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logDateRange, setLogDateRange] = useState<[string, string] | null>(null);
  const [logExporting, setLogExporting] = useState(false);
  const [logClearing, setLogClearing] = useState(false);

  // Google Drive state
  const [driveAuthenticated, setDriveAuthenticated] = useState(false);
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [driveBackups, setDriveBackups] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveUploading, setDriveUploading] = useState(false);
  const [driveRestoring, setDriveRestoring] = useState<string | null>(null);

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

  // Log handlers
  const carregarLogs = async (dataInicio?: string, dataFim?: string) => {
    setLogsLoading(true);
    try {
      const result = await window.electronAPI.getLogs(dataInicio, dataFim);
      setLogs(result);
    } catch (error) {
      message.error('Erro ao carregar logs');
      console.error(error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleLogDateChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      setLogDateRange([dateStrings[0], dateStrings[1]]);
    } else {
      setLogDateRange(null);
    }
  };

  const handleFilterLogs = () => {
    if (logDateRange) {
      carregarLogs(logDateRange[0], logDateRange[1]);
    } else {
      carregarLogs();
    }
  };

  const handleExportLogs = async () => {
    setLogExporting(true);
    try {
      let content: string;
      if (logDateRange) {
        content = await window.electronAPI.exportLogs(logDateRange[0], logDateRange[1]);
      } else {
        content = await window.electronAPI.exportLogs();
      }

      // Criar blob e baixar
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dataInicio = logDateRange ? logDateRange[0].replace(/[/:]/g, '-') : 'todos';
      const dataFim = logDateRange ? logDateRange[1].replace(/[/:]/g, '-') : 'agora';
      a.download = `logs-elos-${dataInicio}_${dataFim}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      message.success('Logs exportados com sucesso!');
    } catch (error) {
      message.error('Erro ao exportar logs');
      console.error(error);
    } finally {
      setLogExporting(false);
    }
  };

  const handleClearLogs = async () => {
    setLogClearing(true);
    try {
      await window.electronAPI.clearLogs(logDateRange?.[0], logDateRange?.[1]);
      message.success('Logs limpos com sucesso!');
      setLogs([]);
    } catch (error) {
      message.error('Erro ao limpar logs');
      console.error(error);
    } finally {
      setLogClearing(false);
    }
  };

  // Google Drive handlers
  const checkDriveStatus = async () => {
    try {
      const status = await window.electronAPI.driveStatus();
      setDriveAuthenticated(status.authenticated);
    } catch (error) {
      console.error('Erro ao verificar status do Drive:', error);
    }
  };

  const handleDriveConnect = async () => {
    setDriveConnecting(true);
    try {
      const success = await window.electronAPI.driveAuthenticate();
      if (success) {
        setDriveAuthenticated(true);
        message.success('Conectado ao Google Drive com sucesso!');
        carregarDriveBackups();
      } else {
        message.error('Falha ao conectar ao Google Drive');
      }
    } catch (error) {
      message.error('Erro ao conectar ao Google Drive');
      console.error(error);
    } finally {
      setDriveConnecting(false);
    }
  };

  const handleDriveDisconnect = async () => {
    try {
      await window.electronAPI.driveDisconnect();
      setDriveAuthenticated(false);
      setDriveBackups([]);
      message.success('Desconectado do Google Drive');
    } catch (error) {
      message.error('Erro ao desconectar');
      console.error(error);
    }
  };

  const carregarDriveBackups = async () => {
    setDriveLoading(true);
    try {
      const backups = await window.electronAPI.driveListBackups();
      setDriveBackups(backups);
    } catch (error) {
      message.error('Erro ao listar backups');
      console.error(error);
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveUpload = async () => {
    setDriveUploading(true);
    try {
      const result = await window.electronAPI.driveUploadBackup('Backup manual');
      message.success(`Backup enviado: ${result.name}`);
      carregarDriveBackups();
    } catch (error) {
      message.error('Erro ao enviar backup');
      console.error(error);
    } finally {
      setDriveUploading(false);
    }
  };

  const handleDriveRestore = async (fileId: string) => {
    setDriveRestoring(fileId);
    try {
      await window.electronAPI.driveDownloadBackup(fileId);
      message.success('Backup restaurado com sucesso!');
    } catch (error) {
      message.error('Erro ao restaurar backup');
      console.error(error);
    } finally {
      setDriveRestoring(null);
    }
  };

  const handleDriveDelete = async (fileId: string) => {
    try {
      await window.electronAPI.driveDeleteBackup(fileId);
      message.success('Backup removido');
      setDriveBackups(prev => prev.filter(b => b.id !== fileId));
    } catch (error) {
      message.error('Erro ao remover backup');
      console.error(error);
    }
  };

  useEffect(() => {
    checkDriveStatus();
  }, []);

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
    {
      key: 'logs',
      label: (
        <span>
          <FileTextOutlined />
          Logs
        </span>
      ),
      children: (
        <Card>
          <Alert
            message="Sistema de Logs"
            description="Visualize, exporte e limpe logs do sistema. Todos os logs são armazenados em arquivos .txt no diretório de dados da aplicação."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <RangePicker
                    showTime
                    format="DD/MM/YYYY HH:mm:ss"
                    placeholder={['Data Início', 'Data Fim']}
                    onChange={handleLogDateChange as any}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col>
                  <Space>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleFilterLogs} loading={logsLoading}>
                      Filtrar
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExportLogs} loading={logExporting}>
                      Exportar TXT
                    </Button>
                    <Popconfirm
                      title="Limpar Logs"
                      description={logDateRange ? 'Limpar logs do período selecionado?' : 'Limpar todos os logs?'}
                      onConfirm={handleClearLogs}
                      okText="Sim"
                      cancelText="Não"
                    >
                      <Button danger icon={<DeleteOutlined />} loading={logClearing}>
                        Limpar
                      </Button>
                    </Popconfirm>
                  </Space>
                </Col>
              </Row>
            </Space>
          </div>

          <Table
            dataSource={logs}
            rowKey="id"
            loading={logsLoading}
            size="small"
            pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} registros` }}
            columns={[
              {
                title: 'Timestamp',
                dataIndex: 'timestamp',
                key: 'timestamp',
                width: 200,
                render: (timestamp: string) => new Date(timestamp).toLocaleString('pt-BR'),
              },
              {
                title: 'Nível',
                dataIndex: 'level',
                key: 'level',
                width: 100,
                render: (level: string) => {
                  const colorMap: Record<string, string> = {
                    error: 'red',
                    warn: 'orange',
                    info: 'blue',
                    debug: 'default',
                  };
                  return <Tag color={colorMap[level] || 'default'}>{level.toUpperCase()}</Tag>;
                },
              },
              {
                title: 'Origem',
                dataIndex: 'source',
                key: 'source',
                width: 150,
              },
              {
                title: 'Mensagem',
                dataIndex: 'message',
                key: 'message',
                ellipsis: true,
              },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'drive',
      label: (
        <span>
          <GoogleOutlined />
          Google Drive
        </span>
      ),
      children: (
        <Card>
          <Alert
            message="Backup na Nuvem"
            description="Conecte sua conta Google para fazer backup do banco de dados diretamente no Google Drive."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          {/* Status da Conexão */}
          <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <Row align="middle" gutter={16}>
              <Col>
                <Tag color={driveAuthenticated ? 'green' : 'red'} style={{ padding: '4px 12px', fontSize: 14 }}>
                  {driveAuthenticated ? 'Conectado' : 'Desconectado'}
                </Tag>
              </Col>
              <Col flex="auto">
                {driveAuthenticated ? (
                  <span style={{ color: '#52c41a' }}>
                    <GoogleOutlined /> Conta Google conectada
                  </span>
                ) : (
                  <span style={{ color: '#999' }}>
                    Conecte sua conta Google para fazer backup na nuvem
                  </span>
                )}
              </Col>
              <Col>
                {driveAuthenticated ? (
                  <Button icon={<DisconnectOutlined />} onClick={handleDriveDisconnect}>
                    Desconectar
                  </Button>
                ) : (
                  <Button type="primary" icon={<GoogleOutlined />} onClick={handleDriveConnect} loading={driveConnecting}>
                    Conectar Google Drive
                  </Button>
                )}
              </Col>
            </Row>
          </div>

          {driveAuthenticated && (
            <>
              <Divider />
              
              {/* Ações */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={12}>
                  <Card size="small" title="Upload">
                    <p style={{ color: '#888', marginBottom: 16 }}>
                      Envia uma cópia do banco de dados atual para o Google Drive
                    </p>
                    <Button type="primary" icon={<CloudUploadOutlined />} onClick={handleDriveUpload} loading={driveUploading} block>
                      Enviar Backup Agora
                    </Button>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="Atualizar Lista">
                    <p style={{ color: '#888', marginBottom: 16 }}>
                      Recarregar lista de backups disponíveis no Drive
                    </p>
                    <Button icon={<CloudSyncOutlined />} onClick={carregarDriveBackups} loading={driveLoading} block>
                      Atualizar Lista
                    </Button>
                  </Card>
                </Col>
              </Row>

              {/* Lista de Backups */}
              <Divider>Backups no Google Drive</Divider>
              
              <Table
                dataSource={driveBackups}
                rowKey="id"
                loading={driveLoading}
                size="small"
                pagination={{ pageSize: 10, showSizeChanger: true }}
                locale={{ emptyText: 'Nenhum backup encontrado' }}
                columns={[
                  {
                    title: 'Nome',
                    dataIndex: 'name',
                    key: 'name',
                    ellipsis: true,
                  },
                  {
                    title: 'Data',
                    dataIndex: 'createdTime',
                    key: 'createdTime',
                    width: 180,
                    render: (time: string) => new Date(time).toLocaleString('pt-BR'),
                  },
                  {
                    title: 'Tamanho',
                    dataIndex: 'size',
                    key: 'size',
                    width: 100,
                    render: (size: string) => {
                      const bytes = parseInt(size);
                      if (bytes < 1024) return `${bytes} B`;
                      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                    },
                  },
                  {
                    title: 'Ações',
                    key: 'actions',
                    width: 180,
                    render: (_: any, record: any) => (
                      <Space>
                        <Popconfirm
                          title="Restaurar Backup"
                          description="Isso substituirá todos os dados atuais. Continuar?"
                          onConfirm={() => handleDriveRestore(record.id)}
                          okText="Sim"
                          cancelText="Não"
                        >
                          <Button
                            size="small"
                            icon={<CloudDownloadOutlined />}
                            loading={driveRestoring === record.id}
                          >
                            Restaurar
                          </Button>
                        </Popconfirm>
                        <Popconfirm
                          title="Remover Backup"
                          description="Remover este backup do Google Drive?"
                          onConfirm={() => handleDriveDelete(record.id)}
                          okText="Sim"
                          cancelText="Não"
                        >
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
            </>
          )}

          {!driveAuthenticated && (
            <Alert
              message="Google Drive não conectado"
              description="Conecte sua conta Google para fazer backup automático dos dados na nuvem e poder restaurar de qualquer lugar."
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
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
            <p><strong>Electron:</strong> {typeof process !== 'undefined' && process.versions?.electron ? process.versions.electron : 'N/A'}</p>
            <p><strong>Node.js:</strong> {typeof process !== 'undefined' && process.versions?.node ? process.versions.node : 'N/A'}</p>
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