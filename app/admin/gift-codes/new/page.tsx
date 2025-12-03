'use client';

import { Breadcrumb, Card } from 'antd';
import { HomeOutlined, GiftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import GiftCodeForm from '@/app/components/admin/GiftCodeForm';

export default function NewGiftCodePage() {
  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link href="/admin"><HomeOutlined /> Dashboard</Link> },
          { title: <Link href="/admin/gift-codes"><GiftOutlined /> Gift Codes</Link> },
          { title: 'Create' },
        ]}
      />
      
      <h2 style={{ marginBottom: 24 }}>Create Gift Code</h2>

      <Card>
        <GiftCodeForm mode="create" />
      </Card>
    </div>
  );
}
