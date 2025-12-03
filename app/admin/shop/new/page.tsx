'use client';

import { Suspense } from 'react';
import { Breadcrumb, Card, Spin } from 'antd';
import { HomeOutlined, ShoppingOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ShopItemForm from '@/app/components/admin/ShopItemForm';

function NewShopItemContent() {
  const searchParams = useSearchParams();
  const tabId = searchParams.get('tabId');

  return (
    <Card>
      <ShopItemForm 
        mode="create" 
        initialData={tabId ? { tab_id: parseInt(tabId) } : undefined}
      />
    </Card>
  );
}

export default function NewShopItemPage() {
  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link href="/admin"><HomeOutlined /> Dashboard</Link> },
          { title: <Link href="/admin/shop"><ShoppingOutlined /> Shop</Link> },
          { title: 'Create' },
        ]}
      />
      
      <h2 style={{ marginBottom: 24 }}>Add Shop Item</h2>

      <Suspense fallback={<Card><Spin /></Card>}>
        <NewShopItemContent />
      </Suspense>
    </div>
  );
}
