'use client';

import { useState, useEffect, use } from 'react';
import { Breadcrumb, Card, Spin, Result, Button } from 'antd';
import { HomeOutlined, ShoppingOutlined } from '@ant-design/icons';
import Link from 'next/link';
import ShopItemForm from '@/app/components/admin/ShopItemForm';

interface ShopOption {
  option_id: number;
  param: number;
}

interface ShopItem {
  id: number;
  tab_id: number;
  temp_id: number;
  gold: number;
  gem: number;
  is_new: boolean;
  is_sell: boolean;
  item_exchange: number;
  quantity_exchange: number;
  options?: ShopOption[];
}

export default function EditShopItemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [shopItem, setShopItem] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopItem = async () => {
      try {
        const response = await fetch(`/api/admin/shop/${resolvedParams.id}`);
        const data = await response.json();

        if (data.success) {
          setShopItem(data.data);
        } else {
          setError(data.message || 'Failed to fetch shop item');
        }
      } catch (err) {
        console.error('Error fetching shop item:', err);
        setError('Failed to fetch shop item');
      } finally {
        setLoading(false);
      }
    };

    fetchShopItem();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !shopItem) {
    return (
      <Result
        status="error"
        title="Shop Item Not Found"
        subTitle={error || 'The shop item you are looking for does not exist.'}
        extra={
          <Link href="/admin/shop">
            <Button type="primary">Back to Shop</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link href="/admin"><HomeOutlined /> Dashboard</Link> },
          { title: <Link href="/admin/shop"><ShoppingOutlined /> Shop</Link> },
          { title: `Edit #${shopItem.id}` },
        ]}
      />
      
      <h2 style={{ marginBottom: 24 }}>Edit Shop Item</h2>

      <Card>
        <ShopItemForm
          mode="edit"
          shopItemId={resolvedParams.id}
          initialData={{
            tab_id: shopItem.tab_id,
            temp_id: shopItem.temp_id,
            gold: shopItem.gold,
            gem: shopItem.gem,
            is_new: shopItem.is_new,
            is_sell: shopItem.is_sell,
            item_exchange: shopItem.item_exchange,
            quantity_exchange: shopItem.quantity_exchange,
            options: shopItem.options,
          }}
        />
      </Card>
    </div>
  );
}
