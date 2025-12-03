'use client';

import { useState, useEffect, use } from 'react';
import { Breadcrumb, Card, Spin, Result, Button } from 'antd';
import { HomeOutlined, TrophyOutlined } from '@ant-design/icons';
import Link from 'next/link';
import MilestoneForm from '@/app/components/admin/MilestoneForm';

interface RewardItem {
  item_id: number;
  item_quantity: number;
  item_options: { item_option_id: number; item_option_param: number }[];
}

interface Milestone {
  id: number;
  required: number;
  descriptor: string | null;
  rewards: string | null;
}

export default function EditMilestonePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMilestone = async () => {
      try {
        const response = await fetch(`/api/admin/milestones/${resolvedParams.id}`);
        const data = await response.json();

        if (data.success) {
          setMilestone(data.data);
        } else {
          setError(data.message || 'Failed to fetch milestone');
        }
      } catch (err) {
        console.error('Error fetching milestone:', err);
        setError('Failed to fetch milestone');
      } finally {
        setLoading(false);
      }
    };

    fetchMilestone();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !milestone) {
    return (
      <Result
        status="error"
        title="Milestone Not Found"
        subTitle={error || 'The milestone you are looking for does not exist.'}
        extra={
          <Link href="/admin/milestones">
            <Button type="primary">Back to Milestones</Button>
          </Link>
        }
      />
    );
  }

  // Parse rewards
  let rewards: RewardItem[] = [];
  if (milestone.rewards) {
    try {
      rewards = JSON.parse(milestone.rewards);
    } catch { /* ignore */ }
  }

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link href="/admin"><HomeOutlined /> Dashboard</Link> },
          { title: <Link href="/admin/milestones"><TrophyOutlined /> Milestones</Link> },
          { title: `Edit #${milestone.id}` },
        ]}
      />
      
      <h2 style={{ marginBottom: 24 }}>Edit Milestone</h2>

      <Card>
        <MilestoneForm
          mode="edit"
          milestoneId={resolvedParams.id}
          initialData={{
            required: milestone.required,
            descriptor: milestone.descriptor || '',
            rewards,
          }}
        />
      </Card>
    </div>
  );
}
