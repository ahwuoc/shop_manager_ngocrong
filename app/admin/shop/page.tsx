'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Badge } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface Tab {
  id: number;
  shop_id: number;
  NAME: string;
  itemCount?: number;
}

export default function ShopPage() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const response = await fetch('/api/admin/tabs');
        const data = await response.json();
        if (data.success) {
          setTabs(data.data);
        }
      } catch (error) {
        console.error('Error fetching tabs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTabs();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Shop Management</h2>
      <p style={{ marginBottom: 24, color: '#666' }}>Select a tab to manage items</p>

      <Row gutter={[16, 16]}>
        {tabs.map((tab) => (
          <Col xs={24} sm={12} md={8} lg={6} key={tab.id}>
            <Link href={`/admin/shop/tab/${tab.id}`}>
              <Card
                hoverable
                style={{ textAlign: 'center' }}
              >
                <ShoppingOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 12 }} />
                <h3 style={{ margin: 0 }}>{tab.NAME}</h3>
                <p style={{ margin: '8px 0 0', color: '#999', fontSize: 12 }}>Tab ID: {tab.id}</p>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}
