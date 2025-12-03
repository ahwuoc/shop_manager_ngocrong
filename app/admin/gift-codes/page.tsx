'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Button, Input, Select, Space, Tag, Popconfirm, message, Card } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

interface GiftCode {
  id: string;
  code: string;
  type: number;
  gold: number;
  gem: number;
  ruby: number;
  items: string | null;
  status: number;
  active: number;
  expires_at: string | null;
  created_at: string | null;
}

interface ItemTemplate {
  id: number;
  NAME: string;
}

interface GiftItem {
  id: number;
  quantity: number;
  options?: { id: number; param: number }[];
}

export default function GiftCodesPage() {
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [itemTemplates, setItemTemplates] = useState<Map<number, string>>(new Map());
  const fetchedItemIds = useRef<Set<number>>(new Set());

  const fetchGiftCodes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        pageSize: pagination.pageSize.toString(),
        search,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/gift-codes?${params}`);
      const data = await response.json();

      if (data.success) {
        setGiftCodes(data.data.items);
        setPagination(prev => ({ ...prev, total: data.data.total }));
      }
    } catch (error) {
      console.error('Error fetching gift codes:', error);
      message.error('Failed to fetch gift codes');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, search, statusFilter]);

  useEffect(() => {
    fetchGiftCodes();
  }, [fetchGiftCodes]);

  // Fetch item templates for items in gift codes
  useEffect(() => {
    const fetchItemNames = async () => {
      const allItemIds = new Set<number>();
      
      giftCodes.forEach(code => {
        if (code.items) {
          try {
            const items: GiftItem[] = JSON.parse(code.items);
            items.forEach(item => allItemIds.add(item.id));
          } catch {
            // Invalid JSON, skip
          }
        }
      });

      // Filter out already fetched IDs
      const newIds = Array.from(allItemIds).filter(id => !fetchedItemIds.current.has(id));
      
      if (newIds.length === 0) return;

      try {
        const response = await fetch(`/api/admin/item-templates?ids=${newIds.join(',')}`);
        const data = await response.json();
        
        if (data.success) {
          const newMap = new Map(itemTemplates);
          data.data.forEach((item: ItemTemplate) => {
            newMap.set(item.id, item.NAME);
            fetchedItemIds.current.add(item.id);
          });
          setItemTemplates(newMap);
        }
      } catch (error) {
        console.error('Error fetching item templates:', error);
      }
    };

    if (giftCodes.length > 0) {
      fetchItemNames();
    }
  }, [giftCodes, itemTemplates]);

  const formatItems = (itemsJson: string | null): string => {
    if (!itemsJson) return '';
    try {
      const items: GiftItem[] = JSON.parse(itemsJson);
      return items.map(item => {
        const name = itemTemplates.get(item.id) || `Item #${item.id}`;
        return `${name} x${item.quantity}`;
      }).join(', ');
    } catch {
      return itemsJson;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/gift-codes/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        message.success('Gift code deleted successfully');
        fetchGiftCodes();
      } else {
        message.error(data.message || 'Failed to delete gift code');
      }
    } catch (error) {
      console.error('Error deleting gift code:', error);
      message.error('Failed to delete gift code');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: number) => {
    try {
      const response = await fetch(`/api/admin/gift-codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentStatus === 1 ? 0 : 1 }),
      });
      const data = await response.json();

      if (data.success) {
        message.success('Status updated successfully');
        fetchGiftCodes();
      } else {
        message.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update status');
    }
  };

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
    }));
  };

  const getStatusTag = (record: GiftCode) => {
    const now = new Date();
    const expiresAt = record.expires_at ? new Date(record.expires_at) : null;
    const isExpired = expiresAt && expiresAt < now;

    if (isExpired) return <Tag color="default">Expired</Tag>;
    
    // type=0: Single-use (status: 0=Unused, 1=Used)
    // type=1: Multi-use (always available)
    if (record.type === 0) {
      if (record.status === 1) return <Tag color="default">Used</Tag>;
      return <Tag color="success">Available</Tag>;
    } else {
      return <Tag color="success">Active</Tag>;
    }
  };

  const formatRewards = (record: GiftCode) => {
    const rewards = [];
    if (record.gold > 0) rewards.push(`${record.gold.toLocaleString()} Gold`);
    if (record.gem > 0) rewards.push(`${record.gem.toLocaleString()} Gem`);
    if (record.ruby > 0) rewards.push(`${record.ruby.toLocaleString()} Ruby`);
    
    const itemsStr = formatItems(record.items);
    if (itemsStr) rewards.push(itemsStr);
    
    return rewards.join(', ') || '-';
  };

  const columns: ColumnsType<GiftCode> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <code style={{ fontWeight: 500 }}>{code}</code>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: number) => (
        <Tag color={type === 0 ? 'blue' : 'purple'}>
          {type === 0 ? 'Single-use (1 user)' : 'Multi-use (many users)'}
        </Tag>
      ),
    },
    {
      title: 'Rewards',
      key: 'rewards',
      render: (_, record) => formatRewards(record),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record),
    },
    {
      title: 'Uses',
      dataIndex: 'active',
      key: 'active',
    },
    {
      title: 'Expiry',
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (date: string | null) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.type === 0 && (
            <Button
              size="small"
              onClick={() => handleToggleStatus(record.id, record.status)}
            >
              {record.status === 1 ? 'Reset (Unused)' : 'Mark Used'}
            </Button>
          )}
          <Link href={`/admin/gift-codes/${record.id}/edit`}>
            <Button size="small" icon={<EditOutlined />}>Edit</Button>
          </Link>
          <Popconfirm
            title="Delete gift code"
            description="Are you sure you want to delete this gift code?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Gift Codes</h2>
        <Link href="/admin/gift-codes/new">
          <Button type="primary" icon={<PlusOutlined />}>Create Gift Code</Button>
        </Link>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search by code..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: '1', label: 'Active' },
              { value: '0', label: 'Inactive' },
            ]}
          />
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={giftCodes}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
}
