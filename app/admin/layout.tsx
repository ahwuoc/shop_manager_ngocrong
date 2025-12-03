'use client';

import { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  GiftOutlined,
  ShoppingOutlined,
  TrophyOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const { Header, Sider, Content } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: <Link href="/admin">Dashboard</Link>,
    },
    {
      key: '/admin/gift-codes',
      icon: <GiftOutlined />,
      label: <Link href="/admin/gift-codes">Gift Codes</Link>,
    },
    {
      key: '/admin/shop',
      icon: <ShoppingOutlined />,
      label: <Link href="/admin/shop">Shop</Link>,
    },
    {
      key: '/admin/milestones',
      icon: <TrophyOutlined />,
      label: <Link href="/admin/milestones">Milestones</Link>,
    },
  ];

  const getSelectedKey = () => {
    if (pathname === '/admin') return '/admin';
    if (pathname.startsWith('/admin/gift-codes')) return '/admin/gift-codes';
    if (pathname.startsWith('/admin/shop')) return '/admin/shop';
    if (pathname.startsWith('/admin/milestones')) return '/admin/milestones';
    return '/admin';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
        }}>
          {collapsed ? 'AD' : 'Admin'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Admin Dashboard</h1>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
