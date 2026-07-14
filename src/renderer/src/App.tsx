import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, message } from 'antd';
import {
  DashboardOutlined,
  InboxOutlined,
  BarcodeOutlined,
  AlertOutlined,
  SearchOutlined,
  CalculatorOutlined,
  WarningOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  SettingOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Itens from './pages/Itens';
import Lotes from './pages/Lotes';
import Validade from './pages/Validade';
import Rastreabilidade from './pages/Rastreabilidade';
import Inventario from './pages/Inventario';
import Rendimento from './pages/Rendimento';
import Perdas from './pages/Perdas';
import Saidas from './pages/Saidas';
import Compras from './pages/Compras';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import { useState, useEffect } from 'react';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return '1';
    if (path === '/itens') return '2';
    if (path === '/lotes') return '3';
    if (path === '/validade') return '4';
    if (path === '/rastreabilidade') return '5';
    if (path === '/inventario') return '6';
    if (path === '/saidas') return '7';
    if (path === '/perdas') return '8';
    if (path === '/compras') return '9';
    if (path === '/relatorios') return '10';
    if (path === '/configuracoes') return '11';
    return '1';
  };

  const menuItems = [
    { key: '1', icon: <DashboardOutlined />, label: 'Dashboard', path: '/' },
    { key: '2', icon: <InboxOutlined />, label: 'Itens', path: '/itens' },
    { key: '3', icon: <BarcodeOutlined />, label: 'Lotes', path: '/lotes' },
    { key: '4', icon: <AlertOutlined />, label: 'Validade', path: '/validade' },
    { key: '5', icon: <SearchOutlined />, label: 'Rastreabilidade', path: '/rastreabilidade' },
    { key: '6', icon: <CalculatorOutlined />, label: 'Inventário', path: '/inventario' },
    { key: '7', icon: <MinusOutlined />, label: 'Saídas', path: '/saidas' },
    { key: '8', icon: <WarningOutlined />, label: 'Perdas', path: '/perdas' },
    { key: '9', icon: <ShoppingCartOutlined />, label: 'Compras', path: '/compras' },
    { key: '10', icon: <BarChartOutlined />, label: 'Relatórios', path: '/relatorios' },
    { key: '11', icon: <SettingOutlined />, label: 'Configurações', path: '/configuracoes' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo">
          {collapsed ? 'E' : 'Elos'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[getSelectedKey()]}
          mode="inline"
          items={menuItems.map(item => ({
            ...item,
            label: <Link to={item.path}>{item.label}</Link>
          }))}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, color: '#1a3a5c' }}>Elos - Gestão de Estoque</h2>
          <Button type="primary" onClick={() => message.info('Funcionalidade de backup em desenvolvimento')}>
            Backup
          </Button>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#f5f5f5', minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/itens" element={<Itens />} />
            <Route path="/lotes" element={<Lotes />} />
            <Route path="/validade" element={<Validade />} />
            <Route path="/rastreabilidade" element={<Rastreabilidade />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/saidas" element={<Saidas />} />
            <Route path="/rendimento" element={<Rendimento />} />
            <Route path="/perdas" element={<Perdas />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;