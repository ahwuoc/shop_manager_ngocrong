'use client';

import { Breadcrumb, Card } from 'antd';
import { HomeOutlined, TrophyOutlined } from '@ant-design/icons';
import Link from 'next/link';
import MilestoneForm from '@/app/components/admin/MilestoneForm';

export default function NewMilestonePage() {
  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link href="/admin"><HomeOutlined /> Dashboard</Link> },
          { title: <Link href="/admin/milestones"><TrophyOutlined /> Milestones</Link> },
          { title: 'Create' },
        ]}
      />
      
      <h2 style={{ marginBottom: 24 }}>Add Milestone</h2>

      <Card>
        <MilestoneForm mode="create" />
      </Card>
    </div>
  );
}
