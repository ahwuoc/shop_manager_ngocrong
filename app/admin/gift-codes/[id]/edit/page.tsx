'use client';

import { useState, useEffect, use } from 'react';
import { Breadcrumb, Card, Spin, Result, Button } from 'antd';
import { HomeOutlined, GiftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import GiftCodeForm from '@/app/components/admin/GiftCodeForm';

interface GiftCode {
  id: string;
  code: string;
  type: number;
  gold: number;
  gem: number;
  ruby: number;
  items: string | null;
  status: number;
  expires_at: string | null;
}

export default function EditGiftCodePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [giftCode, setGiftCode] = useState<GiftCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGiftCode = async () => {
      try {
        const response = await fetch(`/api/admin/gift-codes/${resolvedParams.id}`);
        const data = await response.json();

        if (data.success) {
          setGiftCode(data.data);
        } else {
          setError(data.message || 'Failed to fetch gift code');
        }
      } catch (err) {
        console.error('Error fetching gift code:', err);
        setError('Failed to fetch gift code');
      } finally {
        setLoading(false);
      }
    };

    fetchGiftCode();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !giftCode) {
    return (
      <Result
        status="error"
        title="Gift Code Not Found"
        subTitle={error || 'The gift code you are looking for does not exist.'}
        extra={
          <Link href="/admin/gift-codes">
            <Button type="primary">Back to Gift Codes</Button>
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
          { title: <Link href="/admin/gift-codes"><GiftOutlined /> Gift Codes</Link> },
          { title: `Edit: ${giftCode.code}` },
        ]}
      />
      
      <h2 style={{ marginBottom: 24 }}>Edit Gift Code</h2>

      <Card>
        <GiftCodeForm
          mode="edit"
          giftCodeId={resolvedParams.id}
          initialData={{
            code: giftCode.code,
            type: giftCode.type,
            gold: giftCode.gold,
            gem: giftCode.gem,
            ruby: giftCode.ruby,
            items: giftCode.items || '',
            status: giftCode.status,
            expires_at: giftCode.expires_at || undefined,
          }}
        />
      </Card>
    </div>
  );
}
