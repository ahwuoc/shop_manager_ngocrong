'use client';

import { Card, Row, Col } from 'antd';
import { GiftOutlined, ShoppingOutlined, TrophyOutlined } from '@ant-design/icons';
import Link from 'next/link';

const menuItems = [
  {
    title: 'Gift Codes',
    description: 'Manage gift codes, create new codes, and track usage',
    icon: <GiftOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    href: '/admin/gift-codes',
    color: '#e6f7ff',
  },
  {
    title: 'Shop',
    description: 'Manage shop items, pricing, and availability',
    icon: <ShoppingOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    href: '/admin/shop',
    color: '#f6ffed',
  },
  {
    title: 'Milestones',
    description: 'Configure top-up milestones and rewards',
    icon: <TrophyOutlined style={{ fontSize: 32, color: '#faad14' }} />,
    href: '/admin/milestones',
    color: '#fffbe6',
  },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Welcome to Admin Dashboard</h2>
      <p style={{ marginBottom: 32, color: '#666' }}>
        Select a section below to manage your game settings.
      </p>

      <Row gutter={[24, 24]}>
        {menuItems.map((item) => (
          <Col xs={24} sm={12} lg={8} key={item.href}>
            <Link href={item.href} style={{ display: 'block' }}>
              <Card
                hoverable
                style={{ height: '100%' }}
                styles={{ body: { padding: 24 } }}
              >
                <div style={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: 12, 
                  background: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  {item.icon}
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#666' }}>{item.description}</p>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}
