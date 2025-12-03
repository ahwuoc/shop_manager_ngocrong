'use client';

import { useState, useEffect, useRef } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import type { ColumnsType } from 'antd/es/table';

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
  created_at: string | null;
}

interface ItemTemplate {
  id: number;
  NAME: string;
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemNames, setItemNames] = useState<Map<number, string>>(new Map());
  const fetchedItemIds = useRef<Set<number>>(new Set());

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/milestones');
      const data = await response.json();
      if (data.success) {
        setMilestones(data.data);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      message.error('Failed to fetch milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  // Fetch item names
  useEffect(() => {
    const fetchItemNames = async () => {
      const allItemIds = new Set<number>();
      milestones.forEach(m => {
        if (m.rewards) {
          try {
            const rewards: RewardItem[] = JSON.parse(m.rewards);
            rewards.forEach(r => allItemIds.add(r.item_id));
          } catch { /* ignore */ }
        }
      });

      const newIds = Array.from(allItemIds).filter(id => !fetchedItemIds.current.has(id));
      if (newIds.length === 0) return;

      try {
        const response = await fetch(`/api/admin/item-templates?ids=${newIds.join(',')}`);
        const data = await response.json();
        if (data.success) {
          const newMap = new Map(itemNames);
          data.data.forEach((item: ItemTemplate) => {
            newMap.set(item.id, item.NAME);
            fetchedItemIds.current.add(item.id);
          });
          setItemNames(newMap);
        }
      } catch (error) {
        console.error('Error fetching item names:', error);
      }
    };

    if (milestones.length > 0) fetchItemNames();
  }, [milestones, itemNames]);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/milestones/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        message.success('Deleted');
        fetchMilestones();
      } else {
        message.error(data.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      message.error('Failed to delete');
    }
  };

  const formatRewards = (rewardsJson: string | null) => {
    if (!rewardsJson) return '-';
    try {
      const rewards: RewardItem[] = JSON.parse(rewardsJson);
      return rewards.map((r, i) => {
        const name = itemNames.get(r.item_id) || `Item #${r.item_id}`;
        return (
          <Tag key={i} color="blue" style={{ marginBottom: 4 }}>
            {name} x{r.item_quantity}
            {r.item_options.length > 0 && ` (${r.item_options.length} opts)`}
          </Tag>
        );
      });
    } catch {
      return rewardsJson;
    }
  };

  const columns: ColumnsType<Milestone> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Threshold (VND)',
      dataIndex: 'required',
      key: 'required',
      render: (val: number) => <strong>{val.toLocaleString()}</strong>,
    },
    {
      title: 'Description',
      dataIndex: 'descriptor',
      key: 'descriptor',
      render: (val: string | null) => val || '-',
    },
    {
      title: 'Rewards',
      key: 'rewards',
      render: (_, record) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {formatRewards(record.rewards)}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Link href={`/admin/milestones/${record.id}/edit`}>
            <Button size="small" icon={<EditOutlined />} />
          </Link>
          <Popconfirm
            title="Delete this milestone?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Top-up Milestones</h2>
        <Link href="/admin/milestones/new">
          <Button type="primary" icon={<PlusOutlined />}>Add Milestone</Button>
        </Link>
      </div>

      <Table
        columns={columns}
        dataSource={milestones}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
      />
    </div>
  );
}
